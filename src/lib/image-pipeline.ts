// Image conversion pipeline: decode → edit (crop/rotate/flip) → resize → encode.
// Everything runs on the user's device. Re-encoding through a canvas writes
// only pixels, so metadata (EXIF, GPS, camera details) is dropped unless the
// caller explicitly puts it back (see image-metadata.ts).

import { buildIco } from './favicon'

export type OutputFormat =
   | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/avif'
  | 'image/jxl'
  | 'image/gif'
  | 'image/bmp'
  | 'image/tiff'
  | 'image/x-icon'
export type Rotation = 0 | 90 | 180 | 270

/** Crop in normalised 0–1 coordinates of the rotated + flipped image. */
export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export interface Edits {
  rotation: Rotation
  flipH: boolean
  flipV: boolean
  crop: CropRect | null
}

export const NO_EDITS: Edits = { rotation: 0, flipH: false, flipV: false, crop: null }

export interface FormatInfo {
  label: string
  ext: string
  /** Has a quality setting (and so can aim for a file size). */
  lossy: boolean
  /** Cannot store transparency, so see-through pixels become white. */
  opaque?: boolean
  note: string
}

export const FORMATS: Record<OutputFormat, FormatInfo> = {
  'image/png': { label: 'PNG', ext: 'png', lossy: false, note: 'Lossless, keeps transparency. Largest files.' },
  'image/jpeg': { label: 'JPEG', ext: 'jpg', lossy: true, opaque: true, note: 'Best for photos and maximum compatibility. No transparency.' },
  'image/webp': { label: 'WebP', ext: 'webp', lossy: true, note: 'Smaller than JPEG at the same quality. Works in all modern browsers.' },
  'image/avif': { label: 'AVIF', ext: 'avif', lossy: true, note: 'Smallest files. Newer, and slower to encode.' },
  'image/jxl': {
    label: 'JPEG XL',
    ext: 'jxl',
    lossy: true,
    note: 'Small files with an optional lossless mode. Opens in Safari and newer Chrome and Firefox, but many apps and sites cannot read it yet. Slow to encode.',
  },
  'image/gif': {
    label: 'GIF',
    ext: 'gif',
    lossy: false,
    note: 'Opens everywhere, but holds only 256 colours, so photos look grainy. Best for simple graphics. Saves a still image.',
  },
  'image/bmp': {
    label: 'BMP',
    ext: 'bmp',
    lossy: false,
    opaque: true,
    note: 'Uncompressed, for older Windows apps that need it. Very large files. No transparency.',
  },
  'image/tiff': {
    label: 'TIFF',
    ext: 'tif',
    lossy: false,
    note: 'Lossless, keeps transparency. For printing, scanning and photo editors. Most browsers cannot show it.',
  },
  'image/x-icon': {
    label: 'ICO',
    ext: 'ico',
    lossy: false,
    note: 'Windows and website icon. Holds square copies from 16 to 256 px; non-square images are centred on a transparent square.',
  },
}

/** Sizes stored in an ICO file, up to the image's own size. */
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

export const MAX_DIMENSION = 8000
export const MAX_FILE_BYTES = 50 * 1024 * 1024

export function hasEdits(e: Edits): boolean {
  return e.rotation !== 0 || e.flipH || e.flipV || e.crop !== null
}

export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

/** JPEG XL files often arrive with no MIME type, so the extension counts too. */
export function isJxl(file: Blob & { name?: string }): boolean {
  return file.type === 'image/jxl' || /\.jxl$/i.test(file.name ?? '')
}

export function isTiff(file: Blob & { name?: string }): boolean {
  return file.type === 'image/tiff' || /\.tiff?$/i.test(file.name ?? '')
}

export function isAcceptedImage(file: File): boolean {
  return file.type.startsWith('image/') || isJxl(file) || isTiff(file)
}

export function outputFilename(original: string, format: OutputFormat): string {
  return `${original.replace(/\.[^/.]+$/, '') || 'image'}.${FORMATS[format].ext}`
}

// ---------------------------------------------------------------------------
// Decode
// ---------------------------------------------------------------------------

export interface DecodedImage {
  source: ImageBitmap | HTMLImageElement
  width: number
  height: number
}

function loadElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode'))
    }
    img.src = url
  })
}

/** Decodes JPEG XL with the WebAssembly decoder, which downloads only when needed. */
async function decodeJxlPixels(blob: Blob): Promise<ImageData> {
  const { default: decode } = await import('@jsquash/jxl/decode')
  const data = await decode(await blob.arrayBuffer())
  if (!data) throw new Error('decode')
  return data
}

/** Inflates a Deflate stream, giving up as soon as it grows past `limit` bytes. */
async function inflateLimited(raw: Uint8Array<ArrayBuffer>, limit: number): Promise<Uint8Array> {
  const reader = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate')).getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    // oxlint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > limit) {
      void reader.cancel()
      throw new Error('decode')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

/**
 * Reads the TIFFs this tool writes, and others like them: 8-bit RGB or RGBA,
 * uncompressed or Deflate, one stored image. Most browsers can't open TIFF at
 * all. Anything it can't convert faithfully (predictors, rotated or mirrored
 * orientation, premultiplied alpha, tiles) is refused rather than shown with
 * wrong colours, and sizes are checked before anything big is allocated.
 */
async function decodeTiffPixels(blob: Blob): Promise<ImageData> {
  const buf = await blob.arrayBuffer()
  const v = new DataView(buf)
  const le = v.getUint16(0) === 0x4949
  if (!le && v.getUint16(0) !== 0x4d4d) throw new Error('decode')
  const u16 = (o: number) => v.getUint16(o, le)
  const u32 = (o: number) => v.getUint32(o, le)
  const ifd = u32(4)
  const tags = new Map<number, number[]>()
  for (let n = 0; n < u16(ifd); n++) {
    const e = ifd + 2 + n * 12
    const type = u16(e + 2)
    const count = u32(e + 4)
    if (count > 65536) throw new Error('decode')
    const size = type === 3 ? 2 : 4
    const at = count * size > 4 ? u32(e + 8) : e + 8
    tags.set(u16(e), Array.from({ length: count }, (_, i) => (size === 2 ? u16(at + i * 2) : u32(at + i * 4))))
  }
  const get = (t: number, d?: number) => tags.get(t)?.[0] ?? d
  const width = get(256)!
  const height = get(257)!
  const samples = get(277, 1)!
  const compression = get(259, 1)!
  if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION) throw new Error('decode')
  if (get(262) !== 2 || (samples !== 3 && samples !== 4) || get(284, 1) !== 1) throw new Error('decode')
  if (tags.get(258)?.some((b) => b !== 8) || ![1, 8, 32946].includes(compression)) throw new Error('decode')
  if (get(317, 1) !== 1 || get(274, 1) !== 1 || tags.has(322) || (samples === 4 && get(338, 2) === 1)) throw new Error('decode')
  const expected = width * height * samples
  const offsets = tags.get(273) ?? []
  const counts = tags.get(279) ?? []
  const src = new Uint8Array(expected)
  let filled = 0
  for (const [i, o] of offsets.entries()) {
    if (o + counts[i] > buf.byteLength) throw new Error('decode')
    const raw = new Uint8Array(buf, o, counts[i])
    // oxlint-disable-next-line no-await-in-loop
    const strip = compression === 1 ? raw : await inflateLimited(raw, expected - filled)
    if (filled + strip.length > expected) throw new Error('decode')
    src.set(strip, filled)
    filled += strip.length
  }
  if (filled !== expected) throw new Error('decode')
  const out = new ImageData(width, height)
  for (let i = 0, j = 0; i < width * height; i++, j += samples) {
    out.data[i * 4] = src[j]
    out.data[i * 4 + 1] = src[j + 1]
    out.data[i * 4 + 2] = src[j + 2]
    out.data[i * 4 + 3] = samples === 4 ? src[j + 3] : 255
  }
  return out
}

async function decodeBlob(blob: Blob): Promise<DecodedImage> {
  // EXIF orientation is applied while decoding, so pixels come out upright.
  try {
    const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
    return { source: bmp, width: bmp.width, height: bmp.height }
  } catch {
    if (isJxl(blob) || isTiff(blob)) {
      const bmp = await createImageBitmap(await (isJxl(blob) ? decodeJxlPixels(blob) : decodeTiffPixels(blob)))
      return { source: bmp, width: bmp.width, height: bmp.height }
    }
    const img = await loadElement(blob)
    return { source: img, width: img.naturalWidth, height: img.naturalHeight }
  }
}

/**
 * A blob an <img> can show. JPEG XL and TIFF are shown as-is where the browser
 * can read them, and otherwise as a PNG of the same pixels (for display only).
 */
export async function displayBlob(blob: Blob & { name?: string }): Promise<Blob> {
  if (!isJxl(blob) && !isTiff(blob)) return blob
  try {
    ;(await createImageBitmap(blob)).close()
    return blob
  } catch {
    const data = await (isJxl(blob) ? decodeJxlPixels(blob) : decodeTiffPixels(blob))
    const canvas = document.createElement('canvas')
    canvas.width = data.width
    canvas.height = data.height
    canvas.getContext('2d')?.putImageData(data, 0, 0)
    return canvasToBlob(canvas, 'image/png')
  }
}

/** Decodes any image the browser understands (PNG, JPEG, WebP, GIF, AVIF, SVG, BMP). */
export async function decodeImage(file: File): Promise<DecodedImage> {
  try {
    return await decodeBlob(file)
  } catch {
    throw new Error(
      isHeic(file)
        ? "HEIC photos aren't supported here. On your iPhone, set Settings → Camera → Formats → Most Compatible to save photos as JPEG, or export the photo as JPEG first."
        : "This file couldn't be read as an image. It may be damaged or in a format your browser doesn't support."
    )
  }
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Size of the image after rotation (before crop). */
export function rotatedSize(w: number, h: number, rotation: Rotation): [number, number] {
  return rotation === 90 || rotation === 270 ? [h, w] : [w, h]
}

/** Size of the image after rotation and crop, in source pixels. */
export function editedSize(w: number, h: number, edits: Edits): [number, number] {
  const [rw, rh] = rotatedSize(w, h, edits.rotation)
  if (!edits.crop) return [rw, rh]
  return [Math.max(1, Math.round(edits.crop.w * rw)), Math.max(1, Math.round(edits.crop.h * rh))]
}

/** Largest centred crop of the given aspect ratio (width / height) inside the rotated image. */
export function centredCrop(w: number, h: number, rotation: Rotation, ratio: number): CropRect {
  const [rw, rh] = rotatedSize(w, h, rotation)
  const current = rw / rh
  if (current > ratio) {
    const cw = (rh * ratio) / rw
    return { x: (1 - cw) / 2, y: 0, w: cw, h: 1 }
  }
  const ch = rw / ratio / rh
  return { x: 0, y: (1 - ch) / 2, w: 1, h: ch }
}

/** Fits (w, h) inside a box whose longest edge is `longEdge`, never enlarging. */
export function fitLongEdge(w: number, h: number, longEdge: number): [number, number] {
  const scale = Math.min(1, longEdge / Math.max(w, h))
  return [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))]
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Draws the edited image at the requested output size. JPEG and BMP have no
 * transparency, so they get a white background instead of black.
 */
export function renderEdited(
  img: DecodedImage,
  edits: Edits,
  outW: number,
  outH: number,
  opaque = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(outW))
  canvas.height = Math.max(1, Math.round(outH))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  if (opaque) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const [rw, rh] = rotatedSize(img.width, img.height, edits.rotation)
  const crop = edits.crop ?? { x: 0, y: 0, w: 1, h: 1 }
  const cropW = crop.w * rw
  const cropH = crop.h * rh

  ctx.scale(canvas.width / cropW, canvas.height / cropH)
  ctx.translate(-crop.x * rw, -crop.y * rh)
  // Rotate and flip around the centre of the rotated frame.
  ctx.translate(rw / 2, rh / 2)
  ctx.scale(edits.flipH ? -1 : 1, edits.flipV ? -1 : 1)
  ctx.rotate((edits.rotation * Math.PI) / 180)
  ctx.drawImage(img.source, -img.width / 2, -img.height / 2)
  return canvas
}

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The browser could not encode this image.'))), type, quality)
  })
}

let nativeAvif: Promise<boolean> | null = null
function supportsNativeAvif(): Promise<boolean> {
  nativeAvif ??= (async () => {
    const c = document.createElement('canvas')
    c.width = c.height = 2
    try {
      return (await canvasToBlob(c, 'image/avif', 0.5)).type === 'image/avif'
    } catch {
      return false
    }
  })()
  return nativeAvif
}

/** Encodes a canvas. `quality` is 0–1 and ignored for PNG, and for JPEG XL when `lossless`. */
export async function encodeCanvas(canvas: HTMLCanvasElement, format: OutputFormat, quality: number, lossless = false): Promise<Blob> {
  if (format === 'image/x-icon') return encodeIco(canvas)
  if (format === 'image/gif') return encodeGif(canvas)
  if (format === 'image/bmp') return encodeBmp(canvas)
  if (format === 'image/tiff') return encodeTiff(canvas)
  if (format === 'image/jxl') {
    const { default: encode } = await import('@jsquash/jxl/encode')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const buf = await encode(data, { quality: Math.round(quality * 100), effort: 5, lossless })
    return new Blob([buf], { type: 'image/jxl' })
  }
  if (format === 'image/avif' && !(await supportsNativeAvif())) {
    // No browser encodes AVIF from a canvas yet; use a WebAssembly encoder,
    // downloaded only when AVIF is chosen.
    const { default: encode } = await import('@jsquash/avif/encode')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const buf = await encode(data, { quality: Math.round(quality * 100), speed: 7 })
    return new Blob([buf], { type: 'image/avif' })
  }
  return canvasToBlob(canvas, format, FORMATS[format].lossy ? quality : undefined)
}

function pixels(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

/** Reduces to a 256-colour palette (gifenc, downloaded only when GIF is chosen). */
async function encodeGif(canvas: HTMLCanvasElement): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
  const { data, width, height } = pixels(canvas)
  const palette = quantize(data, 256, { format: 'rgba4444', oneBitAlpha: true })
  const index = applyPalette(data, palette, 'rgba4444')
  const transparentIndex = palette.findIndex((c) => c[3] === 0)
  const gif = GIFEncoder()
  gif.writeFrame(index, width, height, { palette, transparent: transparentIndex >= 0, transparentIndex: Math.max(0, transparentIndex) })
  gif.finish()
  return new Blob([gif.bytes().slice()], { type: 'image/gif' })
}

/** 24-bit uncompressed BMP, the variant every app can open. */
function encodeBmp(canvas: HTMLCanvasElement): Blob {
  const { data, width, height } = pixels(canvas)
  const rowSize = Math.ceil((width * 3) / 4) * 4
  const buf = new ArrayBuffer(54 + rowSize * height)
  const v = new DataView(buf)
  const bytes = new Uint8Array(buf)
  v.setUint16(0, 0x4d42, true) // 'BM'
  v.setUint32(2, buf.byteLength, true)
  v.setUint32(10, 54, true) // pixel data offset
  v.setUint32(14, 40, true) // BITMAPINFOHEADER
  v.setInt32(18, width, true)
  v.setInt32(22, height, true) // positive: rows stored bottom-up
  v.setUint16(26, 1, true) // colour planes
  v.setUint16(28, 24, true) // bits per pixel
  v.setUint32(34, rowSize * height, true)
  v.setInt32(38, 2835, true) // 72 dpi
  v.setInt32(42, 2835, true)
  for (let y = 0; y < height; y++) {
    let o = 54 + (height - 1 - y) * rowSize
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      bytes[o++] = data[i + 2]
      bytes[o++] = data[i + 1]
      bytes[o++] = data[i]
    }
  }
  return new Blob([buf], { type: 'image/bmp' })
}

/** RGBA TIFF in one Deflate-compressed strip (the browser's own zlib). */
async function encodeTiff(canvas: HTMLCanvasElement): Promise<Blob> {
  const { data, width, height } = pixels(canvas)
  const compressed = new Uint8Array(await new Response(new Blob([data.slice()]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer())
  // Tag, type (3 = SHORT, 4 = LONG, 5 = RATIONAL), count, value.
  const tags: [number, number, number, number][] = [
    [256, 4, 1, width],
    [257, 4, 1, height],
    [258, 3, 4, 0], // bits per sample: points at 8,8,8,8
    [259, 3, 1, 8], // Deflate
    [262, 3, 1, 2], // RGB
    [273, 4, 1, 0], // strip offset, filled in below
    [277, 3, 1, 4], // samples per pixel
    [278, 4, 1, height],
    [279, 4, 1, compressed.length],
    [282, 5, 1, 0], // x resolution: points at 72/1
    [283, 5, 1, 0], // y resolution
    [284, 3, 1, 1], // chunky
    [296, 3, 1, 2], // inches
    [338, 3, 1, 2], // extra sample is unassociated alpha
  ]
  const ifdSize = 2 + tags.length * 12 + 4
  const extra = 8 + 8 // bits per sample, then the 72/1 rational
  const headerSize = 8 + ifdSize + extra
  const buf = new ArrayBuffer(headerSize)
  const v = new DataView(buf)
  v.setUint16(0, 0x4949, true) // 'II': little-endian
  v.setUint16(2, 42, true)
  v.setUint32(4, 8, true) // first IFD
  const bitsAt = 8 + ifdSize
  const resAt = bitsAt + 8
  v.setUint16(8, tags.length, true)
  tags.forEach(([tag, type, count, value], n) => {
    const e = 10 + n * 12
    if (tag === 258) value = bitsAt
    if (tag === 273) value = headerSize
    if (tag === 282 || tag === 283) value = resAt
    v.setUint16(e, tag, true)
    v.setUint16(e + 2, type, true)
    v.setUint32(e + 4, count, true)
    if (type === 3 && count === 1) v.setUint16(e + 8, value, true)
    else v.setUint32(e + 8, value, true)
  })
  for (let i = 0; i < 4; i++) v.setUint16(bitsAt + i * 2, 8, true)
  v.setUint32(resAt, 72, true)
  v.setUint32(resAt + 4, 1, true)
  return new Blob([buf, compressed], { type: 'image/tiff' })
}

/** Packs PNG copies of the canvas, fitted onto transparent squares, into one ICO file. */
async function encodeIco(canvas: HTMLCanvasElement): Promise<Blob> {
  const longest = Math.max(canvas.width, canvas.height)
  const fitting = ICO_SIZES.filter((s) => s <= longest)
  const sizes = fitting.length ? fitting : [longest]
  const pngs = await Promise.all(
    sizes.map(async (size) => {
      const square = document.createElement('canvas')
      square.width = square.height = size
      const ctx = square.getContext('2d')
      if (!ctx) throw new Error('Canvas is not available in this browser.')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      const scale = size / longest
      const w = canvas.width * scale
      const h = canvas.height * scale
      ctx.drawImage(canvas, (size - w) / 2, (size - h) / 2, w, h)
      return { size, blob: await canvasToBlob(square, 'image/png') }
    })
  )
  return buildIco(pngs)
}

/**
 * Finds the highest quality whose output fits under `targetBytes` (binary
 * search). If even the lowest quality is too big, returns that smallest file
 * and reports it didn't fit, so the UI can suggest a smaller size.
 */
export async function encodeToTarget(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  targetBytes: number
): Promise<{ blob: Blob; quality: number; fits: boolean }> {
  let lo = 0.05
  let hi = 0.95
  let best: { blob: Blob; quality: number } | null = null
  const steps = format === 'image/avif' || format === 'image/jxl' ? 5 : 7
  for (let i = 0; i < steps; i++) {
    const q = (lo + hi) / 2
    const blob = await encodeCanvas(canvas, format, q)
    if (blob.size <= targetBytes) {
      best = { blob, quality: q }
      lo = q
    } else {
      hi = q
    }
  }
  if (best) return { ...best, fits: true }
  const smallest = await encodeCanvas(canvas, format, 0.05)
  return { blob: smallest, quality: 0.05, fits: smallest.size <= targetBytes }
}

// Image conversion pipeline: decode → edit (crop/rotate/flip) → resize → encode.
// Everything runs on the user's device. Re-encoding through a canvas writes
// only pixels, so metadata (EXIF, GPS, camera details) is dropped unless the
// caller explicitly puts it back (see image-metadata.ts).

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif'
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

export const FORMATS: Record<OutputFormat, { label: string; ext: string; lossy: boolean; note: string }> = {
  'image/png': { label: 'PNG', ext: 'png', lossy: false, note: 'Lossless, keeps transparency. Largest files.' },
  'image/jpeg': { label: 'JPEG', ext: 'jpg', lossy: true, note: 'Best for photos and maximum compatibility. No transparency.' },
  'image/webp': { label: 'WebP', ext: 'webp', lossy: true, note: 'Smaller than JPEG at the same quality. Works in all modern browsers.' },
  'image/avif': { label: 'AVIF', ext: 'avif', lossy: true, note: 'Smallest files. Newer, and slower to encode.' },
}

export const MAX_DIMENSION = 8000
export const MAX_FILE_BYTES = 50 * 1024 * 1024

export function hasEdits(e: Edits): boolean {
  return e.rotation !== 0 || e.flipH || e.flipV || e.crop !== null
}

export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

export function isAcceptedImage(file: File): boolean {
  return file.type.startsWith('image/')
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

async function decodeBlob(blob: Blob): Promise<DecodedImage> {
  // EXIF orientation is applied while decoding, so pixels come out upright.
  try {
    const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
    return { source: bmp, width: bmp.width, height: bmp.height }
  } catch {
    const img = await loadElement(blob)
    return { source: img, width: img.naturalWidth, height: img.naturalHeight }
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
 * Draws the edited image at the requested output size. JPEG has no
 * transparency, so it gets a white background instead of black.
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

/** Encodes a canvas. `quality` is 0–1 and ignored for PNG. */
export async function encodeCanvas(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): Promise<Blob> {
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
  const steps = format === 'image/avif' ? 5 : 7
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

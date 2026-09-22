// src/lib/palang-ic.ts
//
// Pure, React-free logic for the Palang IC tool: crop maths, canvas
// rendering of the MKN-style band and the tiled watermark, PDF assembly
// and localStorage persistence. The page and components only wire state.

import { loadImage } from '@/lib/image-utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** ISO/IEC 7810 ID-1: 85.60 × 53.98 mm. MyKad follows it exactly. */
export const ID1_RATIO = 85.6 / 53.98
/** Output card size: 85.6 × 53.98 mm at 300 dpi. Print-grade, still small. */
export const CARD_W_PX = 1011
export const CARD_H_PX = 638
/** Longest side a source image is downscaled to on load. */
export const MAX_SOURCE_PX = 4000
export const MIN_CROP_W = 0.15

export const CANVAS_FONT = "'Space Grotesk Variable', 'Inter', system-ui, sans-serif"

export const MKN_GUIDANCE_URL =
  'https://www.mkn.gov.my/web/ms/2022/08/14/kad-pengenalan-tips-penjagaan-dan-palang-salinan/'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Rotation = 0 | 90 | 180 | 270
export type SideKey = 'front' | 'back'
export type CardSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement

/** Normalised 0–1 rectangle in ROTATED image space (rotation is applied first). */
export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export interface CardSide {
  file: File
  /** Object URL for the thumbnail only. Revoked when the side is replaced or removed. */
  objectUrl: string
  /** EXIF-corrected, downscaled to ≤ MAX_SOURCE_PX on the longest side. */
  source: CardSource
  /** Source dimensions, unrotated. */
  width: number
  height: number
  rotation: Rotation
  crop: CropRect
}

export type Sides = Record<SideKey, CardSide | null>

export type PresetId =
  | 'ms-standard'
  | 'ms-recipient'
  | 'ms-short'
  | 'en-standard'
  | 'en-recipient'
  | 'custom'

export interface Preset {
  id: PresetId
  label: string
  /** Line templates. {PURPOSE}, {RECIPIENT} and {DATE} are expanded. */
  lines: string[]
}

export const PRESETS: Preset[] = [
  { id: 'ms-standard', label: 'Malay — standard', lines: ['UNTUK KEGUNAAN {PURPOSE} SAHAJA', '{DATE}'] },
  { id: 'ms-recipient', label: 'Malay — with recipient', lines: ['UNTUK KEGUNAAN {PURPOSE} SAHAJA', 'SALINAN UNTUK {RECIPIENT} — {DATE}'] },
  { id: 'ms-short', label: 'Malay — short', lines: ['SALINAN UNTUK {PURPOSE} SAHAJA — {DATE}'] },
  { id: 'en-standard', label: 'English — standard', lines: ['FOR {PURPOSE} USE ONLY', '{DATE}'] },
  { id: 'en-recipient', label: 'English — with recipient', lines: ['FOR {PURPOSE} USE ONLY', 'COPY FOR {RECIPIENT} — {DATE}'] },
  { id: 'custom', label: 'Custom…', lines: [] },
]

export interface BandOptions {
  enabled: boolean
  /** Degrees. Negative = rising to the right, like the JPN sample. */
  angle: number
  lineWidth: number
  /** Distance between the two lines as a fraction of card height. */
  gap: number
  fontSize: number
}

export interface TiledOptions {
  enabled: boolean
  opacity: number
  angle: number
  fontSize: number
  /** Row pitch in multiples of the font size. */
  spacing: number
}

export interface WatermarkOptions {
  presetId: PresetId
  /** One line per row; only used when presetId === 'custom'. */
  customLines: string
  purpose: string
  recipient: string
  /** ISO yyyy-mm-dd from <input type="date">. Rendered as DD/MM/YYYY. */
  date: string
  /** Hex colour for lines and text. */
  color: string
  band: BandOptions
  tiled: TiledOptions
}

export function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const DEFAULT_BAND: BandOptions = { enabled: true, angle: -30, lineWidth: 6, gap: 0.22, fontSize: 44 }
export const DEFAULT_TILED: TiledOptions = { enabled: true, opacity: 0.18, angle: -30, fontSize: 28, spacing: 2.2 }
export const DEFAULT_COLOR = '#111111'

export const DEFAULT_OPTIONS: WatermarkOptions = {
  presetId: 'ms-standard',
  customLines: 'UNTUK KEGUNAAN {PURPOSE} SAHAJA\n{DATE}',
  purpose: '',
  recipient: '',
  date: todayIso(),
  color: DEFAULT_COLOR,
  band: DEFAULT_BAND,
  tiled: DEFAULT_TILED,
}

// ---------------------------------------------------------------------------
// Persistence — text and style only. Never images, never the date (a stale
// date silently stamped on a new copy is exactly the kind of mistake this
// tool exists to prevent).
// ---------------------------------------------------------------------------

export const STORAGE_KEY = 'utilities-palang-ic'

type PersistedOptions = Omit<WatermarkOptions, 'date'>
interface PersistedEnvelope { v: 1; options: Partial<PersistedOptions> }

export function loadPersisted(): WatermarkOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedEnvelope>
      const o = parsed.v === 1 && parsed.options ? parsed.options : {}
      return {
        ...DEFAULT_OPTIONS,
        ...o,
        date: todayIso(),
        band: { ...DEFAULT_BAND, ...o.band },
        tiled: { ...DEFAULT_TILED, ...o.tiled },
      }
    }
  } catch (error) {
    console.error('Failed to load Palang IC settings:', error)
  }
  return { ...DEFAULT_OPTIONS, date: todayIso() }
}

export function savePersisted(options: WatermarkOptions): void {
  try {
    const { date: _date, ...rest } = options
    const envelope: PersistedEnvelope = { v: 1, options: rest }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
  } catch (error) {
    console.error('Failed to save Palang IC settings:', error)
  }
}

// ---------------------------------------------------------------------------
// Text templates
// ---------------------------------------------------------------------------

export interface TemplateVars {
  purpose: string
  recipient: string
  /** Already formatted for display (DD/MM/YYYY). */
  date: string
}

export function formatDateDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

/**
 * Expands {PURPOSE} {RECIPIENT} {DATE}. Segments separated by " — " that
 * end up empty are dropped, as are lines that end up empty, so a preset with
 * a recipient still renders cleanly when no recipient is given.
 */
export function expandLines(lines: string[], vars: TemplateVars): string[] {
  const purpose = vars.purpose.trim() || '[TUJUAN]'
  const recipient = vars.recipient.trim()
  const out: string[] = []
  for (const line of lines) {
    const segments = line
      .split(' — ')
      .map((seg) => {
        const hadRecipient = seg.includes('{RECIPIENT}')
        const expanded = seg
          .split('{PURPOSE}').join(purpose)
          .split('{RECIPIENT}').join(recipient)
          .split('{DATE}').join(vars.date)
          .trim()
        // A segment whose only variable was an empty recipient is noise.
        return hadRecipient && !recipient ? '' : expanded
      })
      .filter((seg) => seg.length > 0)
    const joined = segments.join(' — ')
    if (joined) out.push(joined)
  }
  return out
}

export function resolveLines(options: WatermarkOptions): string[] {
  const preset = PRESETS.find((p) => p.id === options.presetId)
  const templates =
    options.presetId === 'custom' || !preset
      ? options.customLines.split('\n')
      : preset.lines
  return expandLines(templates, {
    purpose: options.purpose,
    recipient: options.recipient,
    date: formatDateDisplay(options.date),
  })
}

export function tiledText(lines: string[]): string {
  return lines.join('  ·  ')
}

// ---------------------------------------------------------------------------
// Source loading
// ---------------------------------------------------------------------------

export interface LoadedSource {
  source: CardSource
  width: number
  height: number
}

/**
 * Decode a file with EXIF orientation applied and cap it at MAX_SOURCE_PX so
 * a 48 MP phone photo does not become a 200 MB bitmap. createImageBitmap
 * historically ignored EXIF in Chrome, hence the explicit option; engines
 * that reject the option fall through to <img>, which honours EXIF by default.
 */
export async function loadCardSource(file: File): Promise<LoadedSource> {
  let decoded: ImageBitmap | HTMLImageElement
  try {
    decoded = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    const url = URL.createObjectURL(file)
    try {
      decoded = await loadImage(url)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  const w = 'naturalWidth' in decoded ? decoded.naturalWidth : decoded.width
  const h = 'naturalHeight' in decoded ? decoded.naturalHeight : decoded.height
  if (!w || !h) throw new Error('Unsupported image format. Please use JPG or PNG.')

  const scale = Math.min(1, MAX_SOURCE_PX / Math.max(w, h))
  if (scale === 1) return { source: decoded, width: w, height: h }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(decoded, 0, 0, canvas.width, canvas.height)
  if ('close' in decoded) decoded.close()
  return { source: canvas, width: canvas.width, height: canvas.height }
}

export function releaseSide(side: CardSide | null): void {
  if (!side) return
  URL.revokeObjectURL(side.objectUrl)
  if ('close' in side.source) side.source.close()
}

// ---------------------------------------------------------------------------
// Crop maths
// ---------------------------------------------------------------------------

/** Dimensions of the image after rotation. */
export function rotatedSize(width: number, height: number, rotation: Rotation): [number, number] {
  return rotation % 180 ? [height, width] : [width, height]
}

/** Largest centred ID-1 rectangle that fits a rw × rh image, normalised. */
export function defaultCrop(rw: number, rh: number): CropRect {
  if (rw / rh > ID1_RATIO) {
    const w = (ID1_RATIO * rh) / rw
    return { x: (1 - w) / 2, y: 0, w, h: 1 }
  }
  const h = rw / (ID1_RATIO * rh)
  return { x: 0, y: (1 - h) / 2, w: 1, h }
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/**
 * Draw the whole source, rotated, scaled to fill destW × destH.
 * Used by the crop editor's background canvas.
 */
export function drawRotated(
  ctx: CanvasRenderingContext2D,
  source: CardSource,
  srcW: number,
  srcH: number,
  rotation: Rotation,
  destW: number,
  destH: number,
): void {
  const [rw, rh] = rotatedSize(srcW, srcH, rotation)
  ctx.save()
  ctx.scale(destW / rw, destH / rh)
  ctx.translate(rw / 2, rh / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.drawImage(source, -srcW / 2, -srcH / 2)
  ctx.restore()
}

/**
 * Draw the cropped region of the rotated source into an OW × OH area at the
 * origin. Goes straight from source to output; no intermediate full-size
 * canvas is allocated, which matters on iOS.
 */
export function drawCropped(ctx: CanvasRenderingContext2D, side: CardSide, OW: number, OH: number): void {
  const { source, width: W, height: H, rotation, crop } = side
  const [rw, rh] = rotatedSize(W, H, rotation)
  const cx = crop.x * rw
  const cy = crop.y * rh
  const cw = crop.w * rw
  const ch = crop.h * rh
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, OW, OH)
  ctx.clip()
  ctx.scale(OW / cw, OH / ch)
  ctx.translate(-cx, -cy)
  ctx.translate(rw / 2, rh / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.drawImage(source, -W / 2, -H / 2)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Watermark rendering
// ---------------------------------------------------------------------------

let fontsPromise: Promise<void> | undefined

/** Make sure the brand font is usable on canvas before the first render. */
export function ensureFonts(): Promise<void> {
  if (!fontsPromise) {
    fontsPromise =
      typeof document === 'undefined' || !('fonts' in document)
        ? Promise.resolve()
        : Promise.all([
            document.fonts.load(`700 40px 'Space Grotesk Variable'`),
            document.fonts.load(`600 40px 'Space Grotesk Variable'`),
          ])
            .then(() => undefined)
            .catch(() => undefined)
  }
  return fontsPromise
}

/**
 * Length of the line through the origin with direction (cos θ, sin θ),
 * clipped to the rectangle [-w/2, w/2] × [-h/2, h/2]. Liang–Barsky.
 */
function chordLength(w: number, h: number, theta: number): number {
  const dx = Math.cos(theta)
  const dy = Math.sin(theta)
  let tMin = -Infinity
  let tMax = Infinity
  // Each [p, q] pair is one edge constraint p·t <= q for the point t·(dx, dy).
  const edges: Array<[number, number]> = [
    [-dx, w / 2], // x >= -w/2
    [dx, w / 2], // x <= w/2
    [-dy, h / 2], // y >= -h/2
    [dy, h / 2], // y <= h/2
  ]
  for (const [p, q] of edges) {
    if (Math.abs(p) < 1e-9) continue
    const t = q / p
    if (p < 0) tMin = Math.max(tMin, t)
    else tMax = Math.min(tMax, t)
  }
  return Math.max(0, tMax - tMin)
}

function drawBand(
  ctx: CanvasRenderingContext2D,
  OW: number,
  OH: number,
  lines: string[],
  band: BandOptions,
  color: string,
): void {
  if (lines.length === 0) return
  const theta = (band.angle * Math.PI) / 180
  const L = OW * Math.abs(Math.cos(theta)) + OH * Math.abs(Math.sin(theta))
  const gap = band.gap * OH

  ctx.save()
  ctx.translate(OW / 2, OH / 2)
  ctx.rotate(theta)

  ctx.strokeStyle = color
  ctx.lineWidth = band.lineWidth
  ctx.lineCap = 'butt'
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(-L / 2, (s * gap) / 2)
    ctx.lineTo(L / 2, (s * gap) / 2)
    ctx.stroke()
  }

  // Fit the text: width against the chord of the card along the centre
  // line, height against the space between the lines.
  const usableW = chordLength(OW, OH, theta) * 0.88
  const usableH = gap - band.lineWidth * 2 - 8
  let fs = band.fontSize
  const lineHeight = () => fs * 1.15
  for (;;) {
    ctx.font = `700 ${fs}px ${CANVAS_FONT}`
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
    if ((widest <= usableW && lines.length * lineHeight() <= usableH) || fs <= 14) break
    fs -= 2
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, fs * 0.16)
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.fillStyle = color
  const y0 = -((lines.length - 1) * lineHeight()) / 2
  lines.forEach((line, i) => {
    const y = y0 + i * lineHeight()
    ctx.strokeText(line, 0, y)
    ctx.fillText(line, 0, y)
  })
  ctx.restore()
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Tiled full-face watermark. Why it is built this way:
 *  - Covering the whole face at ≤ one row pitch guarantees rows cross the
 *    photo, the name and the IC number, so cropping cannot remove it.
 *  - Per-tile alpha jitter means the blended text pixels do not share one
 *    colour, which defeats magic-wand / colour-key removal.
 *  - Low alpha over the guilloche and photo forces an attacker to inpaint
 *    detail rather than paint flat colour.
 *  - source-over rather than multiply: multiply disappears on dark hair and
 *    clothing in the photo, which is exactly where coverage matters.
 */
function drawTiled(
  ctx: CanvasRenderingContext2D,
  OW: number,
  OH: number,
  text: string,
  tiled: TiledOptions,
  color: string,
): void {
  if (!text) return
  const theta = (tiled.angle * Math.PI) / 180
  const R = Math.hypot(OW, OH) / 2
  const rand = mulberry32(hashString(text))

  ctx.save()
  ctx.translate(OW / 2, OH / 2)
  ctx.rotate(theta)
  ctx.font = `600 ${tiled.fontSize}px ${CANVAS_FONT}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = color

  const tileW = ctx.measureText(text).width + tiled.fontSize * 2
  const rowPitch = tiled.fontSize * tiled.spacing
  const rows = Math.ceil(R / rowPitch)
  for (let r = -rows; r <= rows; r++) {
    const y = r * rowPitch
    const offset = r & 1 ? tileW / 2 : 0
    for (let x = -R - tileW + offset; x <= R; x += tileW) {
      ctx.globalAlpha = clamp(tiled.opacity * (0.75 + 0.5 * rand()), 0.04, 0.9)
      ctx.fillText(text, x, y)
    }
  }
  ctx.restore()
}

/**
 * Render one side: cropped card, then the tiled layer, then the band on top
 * so the official marking is always the crispest layer.
 */
export function renderWatermarkedCard(
  side: CardSide,
  options: WatermarkOptions,
  target: { w: number; h: number } = { w: CARD_W_PX, h: CARD_H_PX },
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = target.w
  canvas.height = target.h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  drawCropped(ctx, side, target.w, target.h)
  const lines = resolveLines(options)
  if (options.tiled.enabled) drawTiled(ctx, target.w, target.h, tiledText(lines), options.tiled, options.color)
  if (options.band.enabled) drawBand(ctx, target.w, target.h, lines, options.band, options.color)
  return canvas
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Image export timed out')), 10000)
    try {
      canvas.toBlob((blob) => {
        clearTimeout(timeout)
        if (blob) {
          resolve(blob)
          return
        }
        // Safari occasionally returns null; fall back to a data URL.
        try {
          const dataUrl = canvas.toDataURL('image/png')
          const bin = atob(dataUrl.split(',')[1])
          const bytes = new Uint8Array(bin.length)
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
          resolve(new Blob([bytes], { type: 'image/png' }))
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to export image'))
        }
      }, 'image/png')
    } catch (err) {
      clearTimeout(timeout)
      reject(err instanceof Error ? err : new Error('Failed to export image'))
    }
  })
}

const A4 = { w: 595.28, h: 841.89 }
const MM = 72 / 25.4
const CARD_PT = { w: 85.6 * MM, h: 53.98 * MM }
const CARD_GAP_PT = 12 * MM

/**
 * pdf-lib's standard fonts are WinAnsi encoded and drawText throws on
 * anything outside Latin-1. The card images carry the full Unicode text;
 * only this footer needs sanitising.
 */
function toWinAnsi(s: string): string {
  return s
    .replace(/[—–·]/g, '-')
    .replace(/[^ -~ -ÿ]/g, '')
}

export async function buildPalangPdf(
  cards: { front?: HTMLCanvasElement; back?: HTMLCanvasElement },
  footerText: string,
): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const pdf = await PDFDocument.create()
  pdf.setTitle('Palang IC — salinan MyKad')
  pdf.setProducer('utilities.my')
  pdf.setCreator('utilities.my/palang-ic')

  const page = pdf.addPage([A4.w, A4.h])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const items = [cards.front, cards.back].filter((c): c is HTMLCanvasElement => Boolean(c))
  const total = items.length * CARD_PT.h + (items.length - 1) * CARD_GAP_PT
  // PDF origin is bottom-left; start with the top card.
  let y = (A4.h + total) / 2 - CARD_PT.h
  const x = (A4.w - CARD_PT.w) / 2

  for (const canvas of items) {
    const bytes = new Uint8Array(await (await canvasToPngBlob(canvas)).arrayBuffer())
    const png = await pdf.embedPng(bytes)
    page.drawImage(png, { x, y, width: CARD_PT.w, height: CARD_PT.h })
    // Thin cut guide so the printed copy can be trimmed to size.
    page.drawRectangle({
      x,
      y,
      width: CARD_PT.w,
      height: CARD_PT.h,
      borderWidth: 0.5,
      borderColor: rgb(0.7, 0.7, 0.7),
    })
    y -= CARD_PT.h + CARD_GAP_PT
  }

  const footer = toWinAnsi(`${footerText}  -  Generated locally with utilities.my/palang-ic`)
  page.drawText(footer, {
    x: 40,
    y: 30,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
    maxWidth: A4.w - 80,
    lineHeight: 10,
  })

  const bytes = await pdf.save()
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}

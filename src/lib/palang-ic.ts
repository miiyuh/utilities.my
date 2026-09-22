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

// ---------------------------------------------------------------------------
// Card layouts — where the identity fields sit on a well-cropped card, in
// normalised 0–1 coordinates. Estimates from reference photos; this table is
// the single place to tune them (use "Show field zones" against a real crop).
// ---------------------------------------------------------------------------

export type LayoutId = 'mykad-2026' | 'mykad-classic' | 'generic'
export type ZoneId = 'photo' | 'icNumber' | 'name' | 'address' | 'qr' | 'ghost'

export interface Zone {
  id: ZoneId
  label: string
  rect: CropRect
  /** Key zones are what a fraudster needs; the band is aimed through them. */
  key: boolean
}

export interface CardLayout {
  id: LayoutId
  label: string
  front: Zone[]
  back: Zone[]
}

export const LAYOUTS: Record<LayoutId, CardLayout> = {
  'mykad-2026': {
    id: 'mykad-2026',
    label: 'MyKad — new design (from 17 Sept 2026)',
    front: [
      { id: 'photo', label: 'Photo', rect: { x: 0.05, y: 0.22, w: 0.28, h: 0.68 }, key: true },
      { id: 'icNumber', label: 'IC number', rect: { x: 0.36, y: 0.24, w: 0.34, h: 0.1 }, key: true },
      { id: 'name', label: 'Name', rect: { x: 0.36, y: 0.4, w: 0.44, h: 0.08 }, key: false },
      { id: 'address', label: 'Address', rect: { x: 0.36, y: 0.55, w: 0.49, h: 0.25 }, key: false },
      { id: 'ghost', label: 'Ghost photo', rect: { x: 0.66, y: 0.55, w: 0.12, h: 0.2 }, key: false },
    ],
    back: [
      { id: 'qr', label: 'QR code', rect: { x: 0.7, y: 0.06, w: 0.23, h: 0.36 }, key: true },
      { id: 'icNumber', label: 'IC number', rect: { x: 0.28, y: 0.68, w: 0.47, h: 0.12 }, key: true },
      { id: 'ghost', label: 'Ghost photo', rect: { x: 0.07, y: 0.63, w: 0.13, h: 0.25 }, key: false },
    ],
  },
  'mykad-classic': {
    id: 'mykad-classic',
    label: 'MyKad — classic',
    // Measured from an annotated reference card, normalised against the
    // trimmed card edges (the back scan carried ~1% extra width, corrected).
    front: [
      { id: 'icNumber', label: 'IC number', rect: { x: 0.034, y: 0.225, w: 0.313, h: 0.06 }, key: true },
      { id: 'photo', label: 'Photo', rect: { x: 0.667, y: 0.222, w: 0.301, h: 0.616 }, key: true },
      { id: 'ghost', label: 'Ghost photo', rect: { x: 0.478, y: 0.222, w: 0.166, h: 0.345 }, key: false },
      { id: 'name', label: 'Name', rect: { x: 0.039, y: 0.647, w: 0.608, h: 0.096 }, key: false },
      { id: 'address', label: 'Address', rect: { x: 0.04, y: 0.765, w: 0.607, h: 0.19 }, key: false },
    ],
    // Signature, Touch 'n Go and the serial are not sensitive; the repeated
    // IC number under the signature is.
    back: [{ id: 'icNumber', label: 'IC number', rect: { x: 0.328, y: 0.693, w: 0.384, h: 0.054 }, key: true }],
  },
  generic: { id: 'generic', label: 'Other card / generic', front: [], back: [] },
}
export const LAYOUT_IDS: LayoutId[] = ['mykad-2026', 'mykad-classic', 'generic']

export type BandPlacement = 'fields' | 'corner' | 'across'
export const PLACEMENTS: Array<{ id: BandPlacement; label: string; hint: string }> = [
  { id: 'fields', label: 'Through the identity fields', hint: 'Angle is set automatically so the lines cross the photo and IC number (or the QR code and IC number on the back).' },
  { id: 'corner', label: 'Top-left corner (JPN style)', hint: 'Two short lines across the top-left corner, like the JPN graphic. Best with short text — try the "Malay — short" template or widen the gap.' },
  { id: 'across', label: 'Straight through the centre', hint: 'One long band through the middle of the card at the angle you choose.' },
]
const PLACEMENT_IDS: BandPlacement[] = ['fields', 'corner', 'across']

export interface BandOptions {
  enabled: boolean
  placement: BandPlacement
  /** Degrees. Negative = rising to the right, like the JPN sample. Ignored for 'corner' and auto 'fields'. */
  angle: number
  lineWidth: number
  /** Distance between the two lines as a fraction of card height. */
  gap: number
  fontSize: number
  /** 0.3–1. Below 1 the IC digits stay readable under the line. */
  opacity: number
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
  layout: LayoutId
  /** Cross-hatch the QR code on the back of a 2026 MyKad so it cannot be decoded from a copy. */
  qrShield: boolean
  band: BandOptions
  tiled: TiledOptions
}

export function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const DEFAULT_BAND: BandOptions = {
  enabled: true,
  placement: 'fields',
  angle: -30,
  lineWidth: 6,
  gap: 0.22,
  fontSize: 44,
  opacity: 0.75,
}
export const DEFAULT_TILED: TiledOptions = { enabled: true, opacity: 0.18, angle: -30, fontSize: 28, spacing: 2.2 }
export const DEFAULT_COLOR = '#111111'

export const DEFAULT_OPTIONS: WatermarkOptions = {
  presetId: 'ms-standard',
  customLines: 'UNTUK KEGUNAAN {PURPOSE} SAHAJA\n{DATE}',
  purpose: '',
  recipient: '',
  date: todayIso(),
  color: DEFAULT_COLOR,
  layout: 'mykad-2026',
  qrShield: true,
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
/** Bump `v` only when a key is renamed or changes meaning; new keys are additive and filled from defaults. */
interface PersistedEnvelope { v: 1; options: Partial<PersistedOptions> }

export function loadPersisted(): WatermarkOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedEnvelope>
      const o = parsed.v === 1 && parsed.options ? parsed.options : {}
      const merged: WatermarkOptions = {
        ...DEFAULT_OPTIONS,
        ...o,
        date: todayIso(),
        band: { ...DEFAULT_BAND, ...o.band },
        tiled: { ...DEFAULT_TILED, ...o.tiled },
      }
      // Enum strings index tables below; never let a hand-edited or future
      // value through.
      if (!LAYOUT_IDS.includes(merged.layout)) merged.layout = DEFAULT_OPTIONS.layout
      if (!PLACEMENT_IDS.includes(merged.band.placement)) merged.band.placement = DEFAULT_BAND.placement
      merged.band.opacity = clamp(Number(merged.band.opacity) || DEFAULT_BAND.opacity, 0.3, 1)
      merged.qrShield = Boolean(merged.qrShield)
      return merged
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

// ---------------------------------------------------------------------------
// Band geometry. drawBand and computeCoverage both consume the object from
// resolveBandGeometry so the preview, the chips and the export can never
// disagree about where the lines are.
//
// Conventions: canvas y-down, ctx.rotate(θ) is clockwise on screen. Local
// frame: u along the band (cos θ, sin θ), v across it (−sin θ, cos θ); a
// local point (u, v) sits at C + u·d + v·n.
// ---------------------------------------------------------------------------

export interface BandGeometry {
  /** Band centre in card px. */
  cx: number
  cy: number
  /** Radians, canvas convention. */
  theta: number
  /** Half the distance between the two lines, px. */
  halfGap: number
  corner: boolean
  /** Corner only: the centre line is x + y = kMid. */
  kMid: number
}

const CORNER_INSET = 0.14
const CORNER_MAX_K = 0.95
/** The corner chord is short, so the same gap setting gets a wider strip there to keep the text printable. */
const CORNER_GAP_SCALE = 1.5
const SQRT2 = Math.SQRT2

export function keyZones(layout: LayoutId, sideKey: SideKey): Zone[] {
  return LAYOUTS[layout][sideKey].filter((z) => z.key)
}

export function resolveBandGeometry(
  sideKey: SideKey,
  OW: number,
  OH: number,
  options: WatermarkOptions,
): BandGeometry {
  const { band } = options
  const across = (): BandGeometry => ({
    cx: OW / 2,
    cy: OH / 2,
    theta: (band.angle * Math.PI) / 180,
    halfGap: (band.gap * OH) / 2,
    corner: false,
    kMid: 0,
  })

  if (band.placement === 'corner') {
    const kIn = CORNER_INSET * OH
    const kOut = Math.min(kIn + band.gap * CORNER_GAP_SCALE * OH * SQRT2, CORNER_MAX_K * OH)
    const kMid = (kIn + kOut) / 2
    // Lines x + y = k1 and x + y = k2 are |k2 − k1| / √2 apart.
    return { cx: kMid / 2, cy: kMid / 2, theta: -Math.PI / 4, halfGap: (kOut - kIn) / (2 * SQRT2), corner: true, kMid }
  }

  if (band.placement === 'fields') {
    const zones = keyZones(options.layout, sideKey)
    if (zones.length === 0) return across()
    const centres = zones.map((z) => ({ x: (z.rect.x + z.rect.w / 2) * OW, y: (z.rect.y + z.rect.h / 2) * OH }))
    if (zones.length === 1) return { ...across(), cx: centres[0].x, cy: centres[0].y }
    // Unweighted midpoint of the first two key zones (area-weighting would
    // drag the line into the big photo and off the small IC number), aimed
    // along the line joining them so both are crossed whatever the card.
    const [a, b] = centres
    let dx = b.x - a.x
    let dy = b.y - a.y
    if (dx < 0) {
      dx = -dx
      dy = -dy
    }
    return {
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
      theta: Math.atan2(dy, dx),
      halfGap: (band.gap * OH) / 2,
      corner: false,
      kMid: 0,
    }
  }

  return across()
}

/**
 * t-interval for which P(t) = (px, py) + t·(cos θ, sin θ) lies inside the
 * rectangle [−w/2, w/2] × [−h/2, h/2]; (px, py) relative to the card centre.
 * Liang–Barsky: each [p, q] pair is one edge constraint p·t <= q.
 */
function chordInterval(w: number, h: number, px: number, py: number, theta: number): [number, number] {
  const dx = Math.cos(theta)
  const dy = Math.sin(theta)
  let tMin = -Infinity
  let tMax = Infinity
  const edges: Array<[number, number]> = [
    [-dx, w / 2 + px], // x >= -w/2
    [dx, w / 2 - px], // x <= w/2
    [-dy, h / 2 + py], // y >= -h/2
    [dy, h / 2 - py], // y <= h/2
  ]
  for (const [p, q] of edges) {
    if (Math.abs(p) < 1e-9) continue
    const t = q / p
    if (p < 0) tMin = Math.max(tMin, t)
    else tMax = Math.min(tMax, t)
  }
  return tMin > tMax ? [0, 0] : [tMin, tMax]
}

/** Greedy word wrap of `lines` into rows whose usable width may differ per row. */
function wrapRows(ctx: CanvasRenderingContext2D, lines: string[], widthForRow: (row: number) => number): string[] {
  const rows: string[] = []
  for (const line of lines) {
    let current = ''
    for (const word of line.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word
      if (ctx.measureText(candidate).width <= widthForRow(rows.length) || !current) {
        current = candidate
      } else {
        rows.push(current)
        current = word
      }
    }
    if (current) rows.push(current)
  }
  return rows
}

function drawBand(
  ctx: CanvasRenderingContext2D,
  OW: number,
  OH: number,
  lines: string[],
  band: BandOptions,
  color: string,
  g: BandGeometry,
): void {
  if (lines.length === 0) return
  const { theta, halfGap } = g
  const L = Math.hypot(OW, OH)

  ctx.save()
  ctx.globalAlpha = band.opacity
  ctx.translate(g.cx, g.cy)
  ctx.rotate(theta)

  // Corner lines are finite (they end on the card's left and top edges); the
  // long band is simply clipped by the canvas.
  const halfLen = (v: number) => (g.corner ? g.kMid / SQRT2 + v : L)
  ctx.strokeStyle = color
  ctx.lineWidth = band.lineWidth
  ctx.lineCap = 'butt'
  for (const v of [-halfGap, halfGap]) {
    ctx.beginPath()
    ctx.moveTo(-halfLen(v), v)
    ctx.lineTo(halfLen(v), v)
    ctx.stroke()
  }

  const pad = band.lineWidth + 4
  const usableH = 2 * halfGap - 2 * pad
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.fillStyle = color

  const paint = (text: string, u: number, v: number, fs: number) => {
    ctx.lineWidth = Math.max(2, fs * 0.16)
    ctx.strokeText(text, u, v)
    ctx.fillText(text, u, v)
  }

  if (g.corner) {
    // Rows nearer the outer line are longer, so wrap row by row.
    let fs = band.fontSize
    let rows: string[] = []
    for (;;) {
      ctx.font = `700 ${fs}px ${CANVAS_FONT}`
      const lh = fs * 1.15
      rows = wrapRows(ctx, lines, (r) => 2 * halfLen(-halfGap + pad + r * lh) * 0.9)
      if (rows.length * lh <= usableH || fs <= 14) break
      fs -= 2
    }
    const lh = fs * 1.15
    rows.forEach((row, r) => paint(row, 0, -halfGap + pad + r * lh + lh / 2, fs))
  } else {
    // Fit against the chords at the top, middle and bottom of the text block
    // so an offset band never runs its text off a card corner.
    const px = g.cx - OW / 2
    const py = g.cy - OH / 2
    let fs = band.fontSize
    let u0 = 0
    for (;;) {
      ctx.font = `700 ${fs}px ${CANVAS_FONT}`
      const lh = fs * 1.15
      const a = (lines.length * lh) / 2
      let tMin = -Infinity
      let tMax = Infinity
      for (const v of [-a, 0, a]) {
        const [lo, hi] = chordInterval(OW, OH, px - v * Math.sin(theta), py + v * Math.cos(theta), theta)
        tMin = Math.max(tMin, lo)
        tMax = Math.min(tMax, hi)
      }
      const usableW = Math.max(0, tMax - tMin) * 0.88
      u0 = (tMin + tMax) / 2
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
      if ((widest <= usableW && lines.length * lh <= usableH) || fs <= 14) break
      fs -= 2
    }
    const lh = fs * 1.15
    const y0 = -((lines.length - 1) * lh) / 2
    lines.forEach((line, i) => paint(line, u0, y0 + i * lh, fs))
  }
  ctx.restore()
}

// ---------------------------------------------------------------------------
// QR shield. The 2026 MyKad's QR is readable only by JPN enforcement devices;
// a recipient never needs it, but a clean copy could be replayed. Why this
// pattern defeats decoding:
//  - Two hatch directions at 45 % duty paint 1 − (1 − 0.45)² ≈ 70 % of the
//    area, so ≥ 70 % of 8-module codewords are damaged versus the ≤ 30 %
//    Reed–Solomon level H can correct — and the damage is spread over every
//    RS block, the worst case, rather than one blob.
//  - Solid squares on the four corners are larger than a 7-module finder
//    plus separator at any plausible version, so a decoder never locates the
//    symbol; both copies of the format information sit beside the finders
//    and go with them.
//  - Colour stripes flip light modules dark; the white halo of "SALINAN"
//    flips dark modules light, so no threshold recovers either polarity.
// ---------------------------------------------------------------------------

export function qrShieldRect(OW: number, OH: number, zone: CropRect): { x: number; y: number; w: number; h: number } {
  const pad = 0.02 * OW
  const x = Math.max(0, zone.x * OW - pad)
  const y = Math.max(0, zone.y * OH - pad)
  const r = Math.min(OW, (zone.x + zone.w) * OW + pad)
  const b = Math.min(OH, (zone.y + zone.h) * OH + pad)
  return { x, y, w: r - x, h: b - y }
}

function drawQrShield(ctx: CanvasRenderingContext2D, OW: number, OH: number, zone: CropRect, color: string): void {
  const r = qrShieldRect(OW, OH, zone)
  const D = Math.hypot(r.w, r.h)
  const pitch = 0.035 * OW
  const stripe = 0.45 * pitch

  ctx.save()
  ctx.beginPath()
  ctx.rect(r.x, r.y, r.w, r.h)
  ctx.clip()
  ctx.fillStyle = color
  ctx.globalAlpha = 0.9
  for (const phi of [Math.PI / 4, -Math.PI / 4]) {
    ctx.save()
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2)
    ctx.rotate(phi)
    for (let k = -D; k <= D; k += pitch) ctx.fillRect(k - stripe / 2, -D, stripe, 2 * D)
    ctx.restore()
  }
  ctx.globalAlpha = 0.95
  const sq = 0.16 * Math.min(r.w, r.h)
  for (const [x, y] of [
    [r.x, r.y],
    [r.x + r.w - sq, r.y],
    [r.x, r.y + r.h - sq],
    [r.x + r.w - sq, r.y + r.h - sq],
  ]) {
    ctx.fillRect(x, y, sq, sq)
  }

  ctx.globalAlpha = 1
  let fs = Math.round(r.h * 0.22)
  ctx.font = `700 ${fs}px ${CANVAS_FONT}`
  while (ctx.measureText('SALINAN').width > r.w * 0.8 && fs > 10) {
    fs -= 1
    ctx.font = `700 ${fs}px ${CANVAS_FONT}`
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, fs * 0.18)
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.strokeText('SALINAN', r.x + r.w / 2, r.y + r.h / 2)
  ctx.fillStyle = color
  ctx.fillText('SALINAN', r.x + r.w / 2, r.y + r.h / 2)
  ctx.restore()
}

export function shieldApplies(options: WatermarkOptions, sideKey: SideKey): CropRect | null {
  if (!options.qrShield || options.layout !== 'mykad-2026' || sideKey !== 'back') return null
  return LAYOUTS['mykad-2026'].back.find((z) => z.id === 'qr')?.rect ?? null
}

// ---------------------------------------------------------------------------
// Coverage — which zones the marking actually crosses. A zone is covered by
// the band when the strip of half-width (halfGap + lineWidth/2) around the
// band's centre line overlaps the zone by at least one stroke width. The
// strip is infinite along u and every zone lies inside the card, so the
// band's normal is the only separating axis and the test is exact for all
// three placements.
// ---------------------------------------------------------------------------

export interface ZoneCoverage {
  id: ZoneId
  label: string
  key: boolean
  rect: CropRect
  covered: boolean
  by: 'band' | 'shield' | null
}

export function computeCoverage(sideKey: SideKey, options: WatermarkOptions): ZoneCoverage[] {
  const zones = LAYOUTS[options.layout][sideKey]
  if (zones.length === 0) return []
  const OW = CARD_W_PX
  const OH = CARD_H_PX
  const g = resolveBandGeometry(sideKey, OW, OH, options)
  const bandActive = options.band.enabled && resolveLines(options).length > 0
  const H = g.halfGap + options.band.lineWidth / 2
  const nx = -Math.sin(g.theta)
  const ny = Math.cos(g.theta)
  const shieldZone = shieldApplies(options, sideKey)

  return zones.map((zone) => {
    const { x, y, w, h } = zone.rect
    const corners = [
      [x * OW, y * OH],
      [(x + w) * OW, y * OH],
      [x * OW, (y + h) * OH],
      [(x + w) * OW, (y + h) * OH],
    ]
    const s = corners.map(([X, Y]) => (X - g.cx) * nx + (Y - g.cy) * ny)
    const overlap = Math.min(Math.max(...s), H) - Math.max(Math.min(...s), -H)
    const byBand = bandActive && overlap >= options.band.lineWidth
    const byShield = zone.id === 'qr' && shieldZone !== null
    return {
      id: zone.id,
      label: zone.label,
      key: zone.key,
      rect: zone.rect,
      covered: byBand || byShield,
      by: byBand ? 'band' : byShield ? 'shield' : null,
    }
  })
}

/**
 * Dashed zone outlines for the preview. Only CardPreview calls this, on its
 * own display canvas, so the guides can never end up in an export.
 */
export function drawZoneGuides(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  zones: ZoneCoverage[],
  dpr: number,
): void {
  ctx.save()
  ctx.setLineDash([6 * dpr, 4 * dpr])
  ctx.lineWidth = 1.5 * dpr
  ctx.font = `600 ${10 * dpr}px ${CANVAS_FONT}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  for (const z of zones) {
    const colour = z.key ? (z.covered ? '#16a34a' : '#dc2626') : 'rgba(120,120,120,0.9)'
    const x = z.rect.x * w
    const y = z.rect.y * h
    const rw = z.rect.w * w
    const rh = z.rect.h * h
    ctx.strokeStyle = colour
    ctx.strokeRect(x, y, rw, rh)
    const label = `${z.label}${z.key ? (z.covered ? ' ✓' : ' ✗') : ''}`
    const tw = ctx.measureText(label).width + 6 * dpr
    ctx.fillStyle = colour
    ctx.fillRect(x, y, tw, 13 * dpr)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, x + 3 * dpr, y + 1.5 * dpr)
  }
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
 * Render one side: cropped card, then the tiled layer, then the QR shield,
 * then the band on top so the official marking is always the crispest layer.
 */
export function renderWatermarkedCard(
  side: CardSide,
  options: WatermarkOptions,
  sideKey: SideKey,
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
  const shieldZone = shieldApplies(options, sideKey)
  if (shieldZone) drawQrShield(ctx, target.w, target.h, shieldZone, options.color)
  if (options.band.enabled) {
    drawBand(ctx, target.w, target.h, lines, options.band, options.color, resolveBandGeometry(sideKey, target.w, target.h, options))
  }
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

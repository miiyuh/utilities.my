// Favicon rendering and packaging. Every icon is drawn on a canvas from one
// description (source + style), so all sizes match; the .ico file embeds PNGs.

export type FaviconShape = 'square' | 'rounded' | 'circle'

export type FaviconSource =
  | { kind: 'text'; text: string; font: string; weight: number; color: string }
  | { kind: 'emoji'; emoji: string }
  | { kind: 'image'; image: ImageBitmap | HTMLImageElement; width: number; height: number }

export interface FaviconStyle {
  shape: FaviconShape
  /** null = transparent. */
  background: string | null
  /** Space around the content, as a fraction of the icon (0–0.4). */
  padding: number
}

export const FONT_CHOICES = [
  { id: 'space', label: 'Space Grotesk', css: "'Space Grotesk Variable', system-ui, sans-serif" },
  { id: 'inter', label: 'Inter', css: "'Inter', system-ui, sans-serif" },
  { id: 'serif', label: 'Instrument Serif', css: "'Instrument Serif', Georgia, serif" },
  { id: 'mono', label: 'Source Code Pro', css: "'Source Code Pro', ui-monospace, monospace" },
  { id: 'system', label: 'System', css: 'system-ui, -apple-system, Segoe UI, sans-serif' },
]

const SYSTEM_FONT = FONT_CHOICES.find((f) => f.id === 'system')!.css

const EMOJI_FONT ="'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"

function shapePath(ctx: CanvasRenderingContext2D, size: number, shape: FaviconShape) {
  ctx.beginPath()
  if (shape === 'circle') ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  else if (shape === 'rounded') ctx.roundRect(0, 0, size, size, size * 0.22)
  else ctx.rect(0, 0, size, size)
}

/** Draws the content centred in a box of `inner` px, offset by `offset`. */
function drawContent(ctx: CanvasRenderingContext2D, source: FaviconSource, offset: number, inner: number) {
  if (source.kind === 'image') {
    const scale = Math.min(inner / source.width, inner / source.height)
    const w = source.width * scale
    const h = source.height * scale
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source.image, offset + (inner - w) / 2, offset + (inner - h) / 2, w, h)
    return
  }
  const text = source.kind === 'text' ? source.text : source.emoji
  if (!text) return
  const family = source.kind === 'text' ? source.font : EMOJI_FONT
  const weight = source.kind === 'text' ? source.weight : 400
  ctx.fillStyle = source.kind === 'text' ? source.color : '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  // Start large and shrink until the glyphs' real ink box fits the inner area.
  let px = inner
  let m: TextMetrics
  for (;;) {
    ctx.font = `${weight} ${px}px ${family}`
    m = ctx.measureText(text)
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
    const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    if ((w <= inner && h <= inner) || px <= 4) break
    px *= 0.94
  }
  const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
  const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  // Centre the ink box, not the em box, so letters sit optically centred.
  const x = offset + inner / 2 - inkW / 2 + m.actualBoundingBoxLeft
  const y = offset + inner / 2 - inkH / 2 + m.actualBoundingBoxAscent
  ctx.fillText(text, x, y)
}

/**
 * Renders one icon. `maskable` ignores the shape and fills the whole square
 * with the background, keeping content inside Android's 80% safe zone.
 */
export function renderFavicon(size: number, source: FaviconSource, style: FaviconStyle, opts: { maskable?: boolean; opaque?: string } = {}): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  const bg = style.background ?? opts.opaque ?? null

  if (opts.maskable) {
    ctx.fillStyle = bg ?? '#ffffff'
    ctx.fillRect(0, 0, size, size)
    const inner = size * 0.8 * (1 - style.padding)
    drawContent(ctx, source, (size - inner) / 2, inner)
    return canvas
  }

  ctx.save()
  shapePath(ctx, size, style.shape)
  if (bg) {
    ctx.fillStyle = bg
    ctx.fill()
  }
  ctx.clip()
  const pad = Math.round(size * style.padding)
  drawContent(ctx, source, pad, size - pad * 2)
  ctx.restore()
  return canvas
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create PNG.'))), 'image/png')
  )
}

/** Builds a .ico containing PNG images (supported by every browser since IE Vista-era). */
export async function buildIco(pngs: { size: number; blob: Blob }[]): Promise<Blob> {
  const datas = await Promise.all(pngs.map(async (p) => new Uint8Array(await p.blob.arrayBuffer())))
  const header = new Uint8Array(6 + 16 * pngs.length)
  const v = new DataView(header.buffer)
  v.setUint16(2, 1, true) // type: icon
  v.setUint16(4, pngs.length, true)
  let offset = header.length
  pngs.forEach((p, i) => {
    const e = 6 + i * 16
    header[e] = p.size >= 256 ? 0 : p.size
    header[e + 1] = p.size >= 256 ? 0 : p.size
    v.setUint16(e + 4, 1, true) // colour planes
    v.setUint16(e + 6, 32, true) // bits per pixel
    v.setUint32(e + 8, datas[i].length, true)
    v.setUint32(e + 12, offset, true)
    offset += datas[i].length
  })
  return new Blob([header, ...datas], { type: 'image/x-icon' })
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c] ?? c)
}

/** Colours that change in the dark variant of a text/emoji SVG. */
export interface SvgDarkVariant {
  background: string | null
  /** Text colour (text sources only). */
  color?: string
}

/**
 * A scalable SVG favicon, possible for text and emoji sources. With a dark
 * variant, a prefers-color-scheme rule inside the SVG switches the colours,
 * so one file follows the browser's theme.
 */
export function buildSvg(source: FaviconSource, style: FaviconStyle, dark?: SvgDarkVariant): string | null {
  if (source.kind === 'image') return null
  const text = source.kind === 'text' ? source.text : source.emoji
  if (!text) return null
  const shape =
    style.shape === 'circle'
      ? '<circle class="bg" cx="50" cy="50" r="50"/>'
      : style.shape === 'rounded'
        ? '<rect class="bg" width="100" height="100" rx="22"/>'
        : '<rect class="bg" width="100" height="100"/>'
  // A web font only renders where it is loaded, and a favicon SVG can't load
  // one. So text in any font but the system one is drawn into the SVG as the
  // same artwork the PNGs use, and it looks identical on every site.
  if (source.kind === 'text' && source.font !== SYSTEM_FONT) {
    const art = (s: FaviconSource, st: FaviconStyle) => renderFavicon(128, s, st).toDataURL('image/png')
    const light = `<image class="l" width="100" height="100" href="${art(source, style)}"/>`
    if (!dark) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${light}</svg>`
    const darkArt = art({ ...source, color: dark.color ?? source.color }, { ...style, background: dark.background })
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>.d{display:none}@media (prefers-color-scheme:dark){.l{display:none}.d{display:inline}}</style>${light}<image class="d" width="100" height="100" href="${darkArt}"/></svg>`
  }
  const fontSize = Math.round((1 - style.padding * 2) * (source.kind === 'emoji' ? 80 : text.length > 1 ? 62 : 80))
  const family = source.kind === 'text' ? source.font : EMOJI_FONT
  const weight = source.kind === 'text' ? ` font-weight="${source.weight}"` : ''
  const rules = [
    `.bg{fill:${style.background ? escapeXml(style.background) : 'none'}}`,
    source.kind === 'text' ? `.fg{fill:${escapeXml(source.color)}}` : '',
  ]
  if (dark) {
    rules.push(
      `@media (prefers-color-scheme:dark){.bg{fill:${dark.background ? escapeXml(dark.background) : 'none'}}${
        source.kind === 'text' && dark.color ? `.fg{fill:${escapeXml(dark.color)}}` : ''
      }}`
    )
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>${rules.join('')}</style>${shape}<text class="fg" x="50" y="50" dy=".35em" text-anchor="middle" font-family="${escapeXml(family)}" font-size="${fontSize}"${weight}>${escapeXml(text)}</text></svg>`
}

export function buildManifest(name: string, shortName: string, themeColor: string, backgroundColor: string): string {
  return JSON.stringify(
    {
      name,
      short_name: shortName,
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      theme_color: themeColor,
      background_color: backgroundColor,
      display: 'standalone',
    },
    null,
    2
  )
}

export function buildHtmlSnippet(hasSvg: boolean, themeColor: string, hasDark = false): string {
  const png = (size: number) =>
    hasDark
      ? [
          `<link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-${size}x${size}.png" media="(prefers-color-scheme: light)">`,
          `<link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-dark-${size}x${size}.png" media="(prefers-color-scheme: dark)">`,
        ]
      : [`<link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-${size}x${size}.png">`]
  return [
    '<link rel="icon" href="/favicon.ico" sizes="48x48">',
    hasSvg ? '<link rel="icon" href="/favicon.svg" type="image/svg+xml">' : null,
    ...png(32),
    ...png(16),
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    `<meta name="theme-color" content="${themeColor}">`,
  ]
    .filter(Boolean)
    .join('\n')
}

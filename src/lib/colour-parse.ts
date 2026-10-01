import Color from 'color'

export interface ParsedColour {
  /** Uppercase #RRGGBB (alpha is ignored). */
  hex: string
  /** Human label for the format that was recognised, e.g. "OKLCH". */
  format: string
  /** True when the input was outside sRGB and had to be clipped. */
  clipped: boolean
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

function toHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

/** OKLab → gamma-encoded sRGB (0..1, unclamped), after Björn Ottosson. */
function oklabToSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.sign(c) * Math.abs(c) ** (1 / 2.4) - 0.055)) as [
    number,
    number,
    number,
  ]
}

/** Numbers inside "name(...)", accepting commas, spaces, "/" alpha and % signs. */
function args(body: string): string[] {
  return body
    .split('/')[0]
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function num(token: string, percentScale = 1): number {
  return token.endsWith('%') ? (parseFloat(token) / 100) * percentScale : parseFloat(token)
}

function fromRgb(rgb: [number, number, number], format: string): ParsedColour {
  const clipped = rgb.some((c) => c < -0.01 || c > 1.01)
  return { hex: toHex(...rgb), format, clipped }
}

/**
 * Parses any common colour notation: hex (#rgb, #rrggbb, with or without #),
 * rgb(), hsl(), hwb(), CSS colour names, oklch(), oklab(), cmyk(), or a bare
 * "r, g, b" triple. Returns null when nothing matches.
 */
export function parseColour(input: string): ParsedColour | null {
  const text = input.trim().toLowerCase()
  if (!text) return null

  const fn = /^([a-z]+)\((.*)\)$/.exec(text)
  if (fn) {
    const [, name, body] = fn
    const a = args(body)
    if (name === 'oklch' && a.length >= 3) {
      const L = num(a[0])
      const C = num(a[1], 0.4)
      const H = (parseFloat(a[2]) * Math.PI) / 180
      if ([L, C, H].some(Number.isNaN)) return null
      return fromRgb(oklabToSrgb(L, C * Math.cos(H), C * Math.sin(H)), 'OKLCH')
    }
    if (name === 'oklab' && a.length >= 3) {
      const [L, A, B] = [num(a[0]), num(a[1], 0.4), num(a[2], 0.4)]
      if ([L, A, B].some(Number.isNaN)) return null
      return fromRgb(oklabToSrgb(L, A, B), 'OKLab')
    }
    if ((name === 'cmyk' || name === 'device-cmyk') && a.length >= 4) {
      const [c, m, y, k] = a.slice(0, 4).map((t) => (t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t) > 1 ? parseFloat(t) / 100 : parseFloat(t)))
      if ([c, m, y, k].some(Number.isNaN)) return null
      return fromRgb([(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)], 'CMYK')
    }
  }

  // Bare "12, 34, 56" or "12 34 56" → rgb.
  const triple = /^(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})$/.exec(text)
  if (triple) {
    const rgb = triple.slice(1).map((v) => Number(v) / 255) as [number, number, number]
    if (rgb.every((v) => v <= 1)) return fromRgb(rgb, 'RGB')
  }

  // Hex without the leading "#".
  const bareHex = /^[0-9a-f]{3}([0-9a-f]{1}|[0-9a-f]{3}|[0-9a-f]{5})?$/.exec(text)
  const candidate = bareHex ? `#${text}` : text

  try {
    const c = Color(candidate)
    const format = candidate.startsWith('#')
      ? 'HEX'
      : /^(rgb|hsl|hwb)a?\(/.exec(candidate)?.[1]?.toUpperCase() ?? 'Name'
    return { hex: c.hex().toUpperCase(), format, clipped: false }
  } catch {
    return null
  }
}

// Settings a tool reads from its link, such as /qr-code-generator?fg=3eaf86,
// so another tool can open it ready to go and a link can be shared.

/** "3eaf86", "#3EAF86" or "fff" → "#3EAF86" / "#FFFFFF"; null for anything else. */
export function hexParam(value: string | null): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value?.trim() ?? '')
  if (!m) return null
  const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return `#${hex.toUpperCase()}`
}

/** Whether a "#RRGGBB" colour is light, by its relative luminance (WCAG). */
export function isLight(hex: string): boolean {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5) > 0.5
}

/** A colour as it goes in a link: six hex digits, no "#". */
export const hexForLink = (hex: string) => hex.replace(/^#/, '').toLowerCase()

export interface QrLink {
  fg?: string
  bg?: string
  url?: string
  text?: string
}

/** What a QR Code Generator link asks for: ?fg= and ?bg= colours, and ?url= or ?text= content. */
export function readQrLink(params: URLSearchParams): QrLink {
  const link: QrLink = {}
  const fg = hexParam(params.get('fg'))
  const bg = hexParam(params.get('bg'))
  if (fg) link.fg = fg
  if (bg) link.bg = bg
  const url = params.get('url')
  const text = params.get('text')
  if (url) link.url = url
  else if (text) link.text = text
  return link
}

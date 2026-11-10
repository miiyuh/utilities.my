// File types the tools open and save, and the search that reads them:
// "png to ico", "jpeg → webp", ".md", "pdf".

/** Every extension a tool may list, with its MIME type. */
export const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.jxl': 'image/jxl',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.csv': 'text/csv',
  '.tsv': 'text/tab-separated-values',
  '.webmanifest': 'application/manifest+json',
}

/** Words people type for a type that aren't its extension. */
const ALIASES: Record<string, string> = {
  jpegxl: '.jxl',
  'jpeg-xl': '.jxl',
  'jpeg xl': '.jxl',
}

export interface FileTyped {
  /** Extensions the tool opens as its main input, such as ".png". */
  accepts?: string[]
  /** Extensions it saves. */
  produces?: string[]
}

/** ".PNG", "png" or "jpeg xl" → the extension we know it by; null for anything else. */
export function extensionFor(word: string): string | null {
  const w = word.trim().toLowerCase().replace(/^\*?\./, '')
  if (!w) return null
  if (`.${w}` in MIME) return `.${w}`
  return ALIASES[w] ?? null
}

/** ".jpg" and ".jpeg" are the same type. */
function listed(list: string[] | undefined, ext: string): boolean {
  return !!list?.some((e) => MIME[e] === MIME[ext])
}

export const canOpen = (tool: FileTyped, ext: string) => listed(tool.accepts, ext)
export const canMake = (tool: FileTyped, ext: string) => listed(tool.produces, ext)

/** Whether a file is one of the types, by its extension or, for pasted files with no extension, its MIME type. */
export function isAccepted(file: { name: string; type: string }, accepts: string[]): boolean {
  const ext = /\.[^.]+$/.exec(file.name)?.[0]
  const known = ext && extensionFor(ext)
  if (known) return listed(accepts, known)
  return !!file.type && accepts.some((e) => MIME[e] === file.type.toLowerCase())
}

/** Whether the tool opens this file. */
export const acceptsFile = (tool: FileTyped, file: { name: string; type: string }) => isAccepted(file, tool.accepts ?? [])

export type FileQuery = { from: string; to: string } | { type: string }

const CONVERSION = /^(?:convert\s+)?(.+?)\s*(?:\s(?:to|into)\s|->|→|=>)\s*(.+)$/i

/** Reads "png to ico" as a conversion and "png" as a single type; null when it's neither. */
export function parseFileQuery(query: string): FileQuery | null {
  const q = query.trim()
  const conversion = CONVERSION.exec(q)
  if (conversion) {
    const from = extensionFor(conversion[1])
    const to = extensionFor(conversion[2])
    return from && to ? { from, to } : null
  }
  const type = extensionFor(q)
  return type ? { type } : null
}

/**
 * How well a tool fits: 2 when it does the whole job (the conversion, or both
 * opens and saves the type), 1 when it only opens or only saves it, 0 when not.
 */
export function fileMatch(tool: FileTyped, query: FileQuery): 0 | 1 | 2 {
  if ('from' in query) return canOpen(tool, query.from) && canMake(tool, query.to) ? 2 : 0
  const open = canOpen(tool, query.type)
  const make = canMake(tool, query.type)
  return open && make ? 2 : open || make ? 1 : 0
}

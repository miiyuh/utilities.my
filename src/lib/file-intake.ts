// Checks for files a tool is given, by choosing, dropping or pasting, so every
// tool turns files away with the same messages.

import { MIME, isAccepted } from './file-types'

export const MAX_FILE_BYTES = 50 * 1024 * 1024

/** How a type is named to people: "JPEG", not ".jpg" and ".jpeg". */
const LABELS: Record<string, string> = {
  '.jpg': 'JPEG',
  '.jpeg': 'JPEG',
  '.jxl': 'JPEG XL',
  '.webp': 'WebP',
  '.tif': 'TIFF',
  '.tiff': 'TIFF',
  '.md': 'Markdown',
  '.markdown': 'Markdown',
  '.txt': 'plain text',
}

/** "PNG, JPEG, WebP or GIF": each type once, in the order given. */
export function typeList(accepts: string[]): string {
  const names = [...new Set(accepts.map((e) => LABELS[e] ?? e.slice(1).toUpperCase()))]
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`
}

/** The file picker's `accept`: extensions for desktop pickers, MIME types for phone photo libraries. */
export function pickerAccept(accepts: string[]): string {
  return [...new Set(accepts.flatMap((e) => [e, MIME[e]]))].join(',')
}

function sizeLabel(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

export const isHeic = (file: { name: string; type: string }) =>
  /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)

export interface IntakeRules {
  /** Extensions the tool opens, such as ".png". */
  accepts: string[]
  /** Largest file allowed; 50 MB unless set. */
  maxBytes?: number
}

/** Why the file can't be used, or null when it can. */
export function fileProblem(file: { name: string; type: string; size: number }, rules: IntakeRules): string | null {
  const name = file.name || 'That file'
  if (isHeic(file) && !rules.accepts.some((e) => MIME[e] === 'image/heic')) {
    return `${name} is a HEIC photo, which isn't supported. Save it as JPEG on your iPhone (Settings → Camera → Formats → Most Compatible) or export it as JPEG first.`
  }
  if (!isAccepted(file, rules.accepts)) return `${name} can't be opened here. Use ${typeList(rules.accepts)}.`
  const max = rules.maxBytes ?? MAX_FILE_BYTES
  if (file.size > max) return `${name} is larger than ${sizeLabel(max)}.`
  return null
}

/** Splits files into the ones the tool can use and the reasons the others were turned away. */
export function sortFiles<F extends { name: string; type: string; size: number }>(
  files: F[],
  rules: IntakeRules
): { accepted: F[]; problems: string[] } {
  const accepted: F[] = []
  const problems: string[] = []
  for (const file of files) {
    const problem = fileProblem(file, rules)
    if (problem) problems.push(problem)
    else accepted.push(file)
  }
  return { accepted, problems }
}

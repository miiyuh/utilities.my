// Operations on a list of lines, each returning the new lines and a short
// description of what changed, for the Sorter.

export type SortBy = 'text' | 'number' | 'length' | 'column'

export interface SortOptions {
  by: SortBy
  descending: boolean
  /** "item 2" before "item 10" (text and column sorts). */
  natural: boolean
  caseSensitive: boolean
  /** 1-based column for `by: 'column'`. */
  column: number
  /** Column separator; empty means detect tab, comma, semicolon or pipe. */
  delimiter: string
}

export interface Result {
  lines: string[]
  message: string
}

export const splitLines = (text: string) => (text === '' ? [] : text.replace(/\r\n?/g, '\n').split('\n'))

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`

/** The first number in a line: "RM 1,250.50 total" → 1250.5. */
export function firstNumber(line: string): number | null {
  const m = line.match(/-?\d[\d,]*(?:\.\d+)?/)
  if (!m) return null
  const n = Number(m[0].replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 20).join('\n')
  for (const d of ['\t', ',', ';', '|']) if (sample.includes(d)) return d
  return ','
}

export function sortLines(lines: string[], o: SortOptions): Result {
  const collator = new Intl.Collator(undefined, { numeric: o.natural, sensitivity: o.caseSensitive ? 'case' : 'base' })
  const dir = o.descending ? -1 : 1
  const delimiter = o.delimiter || detectDelimiter(lines)
  const cell = (l: string) => (l.split(delimiter)[o.column - 1] ?? '').trim()

  const compare = (a: string, b: string): number => {
    switch (o.by) {
      case 'number': {
        const x = firstNumber(a)
        const y = firstNumber(b)
        // Lines without a number always go last, whatever the direction.
        if (x == null || y == null) return x == null && y == null ? collator.compare(a, b) : x == null ? 1 : -1
        return (x - y) * dir || collator.compare(a, b)
      }
      case 'length':
        return (Array.from(a).length - Array.from(b).length) * dir || collator.compare(a, b)
      case 'column': {
        const x = cell(a)
        const y = cell(b)
        // Amounts with labels ("RM 2", "RM 10") compare by their numbers when both cells have one.
        const nx = firstNumber(x)
        const ny = firstNumber(y)
        if (nx != null && ny != null && nx !== ny) return (nx - ny) * dir
        return collator.compare(x, y) * dir
      }
      default:
        return collator.compare(a, b) * dir
    }
  }

  const sorted = [...lines].sort(compare)
  const how: Record<SortBy, string> = {
    text: o.descending ? 'Z to A' : 'A to Z',
    number: o.descending ? 'largest number first' : 'smallest number first',
    length: o.descending ? 'longest first' : 'shortest first',
    column: `by column ${o.column}, ${o.descending ? 'descending' : 'ascending'}`,
  }
  return { lines: sorted, message: `Sorted ${plural(lines.length, 'line')} ${how[o.by]}.` }
}

/** Lines that differ only in surrounding spaces (or case, unless case-sensitive) count as duplicates. */
const dupKey = (l: string, caseSensitive: boolean) => (caseSensitive ? l.trim() : l.trim().toLocaleLowerCase())

export function removeDuplicates(lines: string[], caseSensitive: boolean): Result {
  const seen = new Set<string>()
  const out = lines.filter((l) => {
    const key = dupKey(l, caseSensitive)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const removed = lines.length - out.length
  return { lines: out, message: removed ? `Removed ${plural(removed, 'duplicate')}, kept the first of each.` : 'No duplicates found.' }
}

export function removeEmpty(lines: string[]): Result {
  const out = lines.filter((l) => l.trim() !== '')
  const removed = lines.length - out.length
  return { lines: out, message: removed ? `Removed ${plural(removed, 'empty line')}.` : 'No empty lines found.' }
}

export function trimLines(lines: string[]): Result {
  let changed = 0
  const out = lines.map((l) => {
    const t = l.trim().replace(/\s{2,}/g, ' ')
    if (t !== l) changed++
    return t
  })
  return { lines: out, message: changed ? `Tidied spaces on ${plural(changed, 'line')}.` : 'No extra spaces found.' }
}

export function reverseLines(lines: string[]): Result {
  return { lines: [...lines].reverse(), message: `Reversed the order of ${plural(lines.length, 'line')}.` }
}

/** "a, b, c" on any line becomes one item per line. Empty fields are kept; Remove empty lines clears them. */
export function splitItems(lines: string[], separator: string): Result {
  const sep = separator || ','
  const out = lines.flatMap((l) => l.split(sep)).map((s) => s.trim())
  return { lines: out, message: `Split into ${plural(out.length, 'line')}.` }
}

/** All lines on one line, joined with the separator. */
export function joinItems(lines: string[], separator: string): Result {
  const items = lines.map((l) => l.trim())
  const sep = separator === ',' ? ', ' : separator === ';' ? '; ' : separator
  return { lines: [items.join(sep)], message: `Joined ${plural(items.length, 'item')} into one line.` }
}

export function numberLines(lines: string[]): Result {
  const width = String(lines.length).length
  const out = lines.map((l, i) => `${String(i + 1).padStart(width, ' ')}. ${l.replace(/^\s*\d+[.)]\s+/, '')}`)
  return { lines: out, message: `Numbered ${plural(lines.length, 'line')}.` }
}

export function listStats(lines: string[], caseSensitive: boolean) {
  const nonEmpty = lines.filter((l) => l.trim() !== '')
  const unique = new Set(nonEmpty.map((l) => dupKey(l, caseSensitive))).size
  return { lines: lines.length, items: nonEmpty.length, unique, duplicates: nonEmpty.length - unique }
}

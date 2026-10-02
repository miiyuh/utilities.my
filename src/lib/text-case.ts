// Text case conversions. Unicode-aware (accented letters count as letters),
// line-preserving, and tuned for Malaysian text: small Malay words and the
// patronymics in names (bin, binti, a/l, a/p) stay lowercase in title case.

export type CaseId =
  | 'sentence'
  | 'title'
  | 'upper'
  | 'lower'
  | 'capitalised'
  | 'alternating'
  | 'inverse'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'dot'

export interface CaseOptions {
  /** Title case leaves short joining words lowercase ("Nasi Lemak and Teh Tarik"). */
  smartTitle: boolean
  /** Words already written with capitals inside them (IC, KL, iPhone, MyKad) stay as written. */
  keepAcronyms: boolean
  /** Trim each line and squeeze runs of spaces into one. */
  tidySpaces: boolean
}

export interface CaseDef {
  id: CaseId
  name: string
  /** For identifiers: shown in a code face and converted line by line. */
  code?: boolean
  convert: (text: string, opts: CaseOptions) => string
}

/** English and Malay joining words kept lowercase mid-title, plus the parts of Malaysian names that are. */
const SMALL_WORDS = new Set([
  // English
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'per', 'so', 'the', 'to', 'up', 'via', 'vs', 'vs.', 'with', 'yet',
  // Malay
  'dan', 'di', 'ke', 'dari', 'daripada', 'pada', 'yang', 'untuk', 'atau', 'dengan', 'oleh', 'bagi', 'serta', 'kepada', 'dalam',
  // Names
  'bin', 'binti', 'bt', 'bte', 'a/l', 'a/p', 'al', 'ap',
])

const LETTER = /\p{L}/u
const WORD_CHARS = /[^\p{L}\p{M}\p{N}]+/u

/** A word written with a capital after its first letter: IC, KL, USA, iPhone, MyKad. */
function hasInnerCapital(word: string): boolean {
  const letters = word.replace(/[^\p{L}]/gu, '')
  return letters.length >= 2 && /\p{Lu}/u.test(letters.slice(1))
}

/** Mostly-uppercase input ("NASI LEMAK") is shouting, not acronyms, so it shouldn't be kept. */
function isShouting(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, '')
  if (letters.length < 4) return false
  const upper = letters.replace(/[^\p{Lu}]/gu, '').length
  return upper / letters.length > 0.8
}

function capitaliseFirstLetter(word: string): string {
  const i = word.search(LETTER)
  if (i < 0) return word
  const ch = String.fromCodePoint(word.codePointAt(i)!)
  return word.slice(0, i) + ch.toUpperCase() + word.slice(i + ch.length)
}

function tidy(text: string, opts: CaseOptions): string {
  if (!opts.tidySpaces) return text
  return text
    .split('\n')
    .map((l) => l.trim().replace(/[ \t]+/g, ' '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Splits a line into words for identifier cases: "parseHTTPResponse v2" → parse, HTTP, Response, v2. */
function identifierWords(line: string): string[] {
  return line
    .normalize('NFC') // join a letter and its separate accent mark into one character
    .replace(/['’]/g, '') // "I'm" → "Im", not "I m"
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(WORD_CHARS)
    .filter(Boolean)
}

function perLine(text: string, join: (words: string[]) => string): string {
  return text
    .split('\n')
    .map((line) => join(identifierWords(line)))
    .join('\n')
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()

function titleCase(text: string, opts: CaseOptions): string {
  const keep = opts.keepAcronyms && !isShouting(text)
  return text
    .split('\n')
    .map((line) => {
      const tokens = line.split(/(\s+)/)
      const wordAt = tokens.map((t, i) => (/\S/.test(t) ? i : -1)).filter((i) => i >= 0)
      const first = wordAt[0]
      const last = wordAt[wordAt.length - 1]
      return tokens
        .map((t, i) => {
          if (!/\S/.test(t)) return t
          if (keep && hasInnerCapital(t)) return t
          const lower = t.toLowerCase()
          const bare = lower.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}/.]+$/gu, '')
          if (opts.smartTitle && i !== first && i !== last && SMALL_WORDS.has(bare)) return lower
          // Capitalise each part of a hyphenated word: "check-in" → "Check-In".
          return lower.split('-').map(capitaliseFirstLetter).join('-')
        })
        .join('')
    })
    .join('\n')
}

function sentenceCase(text: string, opts: CaseOptions): string {
  const keep = opts.keepAcronyms && !isShouting(text)
  const words = text.split(/(\s+)/).map((t) => {
    if (!/\S/.test(t)) return t
    if (keep && hasInnerCapital(t)) return t
    const lower = t.toLowerCase()
    // The English pronoun "I" and its contractions stay capital.
    return /^i(['’](m|ve|ll|d))?[^\p{L}]*$/u.test(lower) ? 'I' + lower.slice(1) : lower
  })
  let startOfSentence = true
  return words
    .map((t) => {
      if (!/\S/.test(t)) {
        if (t.includes('\n')) startOfSentence = true
        return t
      }
      const out = startOfSentence ? capitaliseFirstLetter(t) : t
      startOfSentence = /[.!?]["'’”)]*$/.test(t)
      return out
    })
    .join('')
}

function alternating(text: string): string {
  let n = 0
  return Array.from(text)
    .map((ch) => {
      if (!LETTER.test(ch)) return ch
      return n++ % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase()
    })
    .join('')
}

function inverse(text: string): string {
  return Array.from(text)
    .map((ch) => (ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase()))
    .join('')
}

export const CASES: CaseDef[] = [
  { id: 'sentence', name: 'Sentence case', convert: sentenceCase },
  { id: 'title', name: 'Title Case', convert: titleCase },
  { id: 'upper', name: 'UPPERCASE', convert: (t) => t.toUpperCase() },
  { id: 'lower', name: 'lowercase', convert: (t) => t.toLowerCase() },
  {
    id: 'capitalised',
    name: 'Capitalised Each Word',
    convert: (t, o) => titleCase(t, { ...o, smartTitle: false }),
  },
  { id: 'alternating', name: 'aLtErNaTiNg', convert: alternating },
  { id: 'inverse', name: 'iNVERSE', convert: inverse },
  {
    id: 'camel',
    name: 'camelCase',
    code: true,
    convert: (t) => perLine(t, (w) => w.map((x, i) => (i === 0 ? x.toLowerCase() : cap(x))).join('')),
  },
  { id: 'pascal', name: 'PascalCase', code: true, convert: (t) => perLine(t, (w) => w.map(cap).join('')) },
  { id: 'snake', name: 'snake_case', code: true, convert: (t) => perLine(t, (w) => w.map((x) => x.toLowerCase()).join('_')) },
  { id: 'kebab', name: 'kebab-case', code: true, convert: (t) => perLine(t, (w) => w.map((x) => x.toLowerCase()).join('-')) },
  { id: 'constant', name: 'CONSTANT_CASE', code: true, convert: (t) => perLine(t, (w) => w.map((x) => x.toUpperCase()).join('_')) },
  { id: 'dot', name: 'dot.case', code: true, convert: (t) => perLine(t, (w) => w.map((x) => x.toLowerCase()).join('.')) },
]

/** Every case of the text at once, after optional tidying. */
export function convertAll(text: string, opts: CaseOptions): Map<CaseId, string> {
  const source = tidy(text, opts)
  return new Map(CASES.map((c) => [c.id, c.convert(source, opts)]))
}

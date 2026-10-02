// Text statistics. Words are runs of letters or digits in any script, so
// Malay, accented and non-Latin text all count properly.

export interface StatsOptions {
  /** Count "2026" or "15" as words. */
  countNumbers: boolean
  /** Leave everyday words ("the", "dan", "yang") out of the top words list. */
  ignoreCommonWords: boolean
}

export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  uniqueWords: number
  sentences: number
  paragraphs: number
  lines: number
  avgWordLength: number
  longestWord: string
  readingSeconds: number
  speakingSeconds: number
  topWords: { word: string; count: number }[]
  /** Flesch reading ease, meaningful for English only; null when too short to judge. */
  readingEase: number | null
}

/** Reading and speaking speeds used for the time estimates (words per minute). */
export const READING_WPM = 200
export const SPEAKING_WPM = 130

const COMMON_WORDS = new Set([
  // English
  'a', 'about', 'after', 'all', 'also', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me', 'more', 'my', 'no', 'not', 'of', 'on', 'or', 'our', 'out', 'she', 'so', 'some', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'to', 'up', 'us', 'was', 'we', 'were', 'what', 'when', 'which', 'who', 'will', 'with', 'would', 'you', 'your',
  // Malay
  'ada', 'adalah', 'akan', 'aku', 'anda', 'apa', 'apabila', 'atau', 'awak', 'bagi', 'bahawa', 'banyak', 'belum', 'boleh', 'dalam', 'dan', 'dari', 'daripada', 'dengan', 'di', 'dia', 'hanya', 'ia', 'ialah', 'ini', 'itu', 'jika', 'juga', 'kami', 'kepada', 'kerana', 'ke', 'kita', 'lagi', 'lebih', 'mana', 'masih', 'mereka', 'nak', 'ni', 'oleh', 'pada', 'para', 'perlu', 'pun', 'saya', 'sangat', 'satu', 'sebagai', 'semua', 'seperti', 'sudah', 'telah', 'tersebut', 'tetapi', 'tidak', 'tu', 'untuk', 'yang', 'je', 'lah',
])

const WORD = /[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu

/** Rough English syllable count, for the readability score only. */
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups?.length ?? 1)
}

export function computeStats(text: string, opts: StatsOptions): TextStats {
  const all = text.match(WORD) ?? []
  const tokens = opts.countNumbers ? all : all.filter((t) => !/^\p{N}+$/u.test(t))
  const lower = tokens.map((t) => t.toLowerCase())
  const words = tokens.length

  const sentenceList = text
    .split(/(?<=[.!?…])["'’”)\]]*\s+|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\p{N}]/u.test(s))
  const sentences = sentenceList.length

  const freq = new Map<string, number>()
  for (const w of lower) {
    if (opts.ignoreCommonWords && (COMMON_WORDS.has(w) || w.length < 2)) continue
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  const topWords = [...freq.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, 20)

  const longestWord = tokens.reduce((a, w) => (w.length > a.length ? w : a), '')
  const letters = tokens.reduce((n, w) => n + w.length, 0)

  let readingEase: number | null = null
  if (words >= 30 && sentences > 0) {
    const syl = tokens.reduce((n, w) => n + syllables(w), 0)
    readingEase = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syl / words))
  }

  return {
    characters: Array.from(text).length,
    charactersNoSpaces: Array.from(text.replace(/\s/g, '')).length,
    words,
    uniqueWords: new Set(lower).size,
    sentences,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    lines: text === '' ? 0 : text.split('\n').length,
    avgWordLength: words ? Math.round((letters / words) * 10) / 10 : 0,
    longestWord,
    readingSeconds: Math.round((words / READING_WPM) * 60),
    speakingSeconds: Math.round((words / SPEAKING_WPM) * 60),
    topWords,
    readingEase,
  }
}

/** "45 s", "3 min", "1 h 5 min". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${m % 60} min`
}

/** How easy English text is to read, by Flesch reading ease band. */
export function easeLabel(score: number): string {
  if (score >= 80) return 'Very easy'
  if (score >= 60) return 'Plain English'
  if (score >= 50) return 'Fairly difficult'
  if (score >= 30) return 'Difficult'
  return 'Very difficult'
}

/** Common length limits people write to. Counted as plain characters; some platforms count links or emoji differently. */
export const LIMITS: { id: string; label: string; max: number }[] = [
  { id: 'title', label: 'Search result title', max: 60 },
  { id: 'meta', label: 'Meta description', max: 160 },
  { id: 'x', label: 'X post', max: 280 },
  { id: 'threads', label: 'Threads post', max: 500 },
  { id: 'instagram', label: 'Instagram caption', max: 2200 },
  { id: 'linkedin', label: 'LinkedIn post', max: 3000 },
]

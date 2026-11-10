// Answers the command palette can give straight away, without opening a tool:
// "10 km to mi", "#1e90ff", "1700000000", "20% of 150".

import { parseColour } from './colour-parse'
import { CATEGORIES, convert, roundForDisplay, type Category, type Unit } from './units'

export interface QuickAnswer {
  /** What gets copied. */
  value: string
  /** Extra detail shown under the value. */
  detail?: string
  /** The tool that does this properly. */
  toolPath: string
  /** A colour swatch to show beside the answer. */
  swatch?: string
}

const NUMBER = String.raw`(-?\d+(?:\.\d+)?)`

function fmt(n: number): string {
  return roundForDisplay(n, 4, false)
}

// --- Units ------------------------------------------------------------------

/** Spellings people type for a unit: its id, symbol and name, singular too. */
function spellings(unit: Unit): string[] {
  const name = unit.name.toLowerCase()
  const singular = name
    .replace(/^feet$/, 'foot')
    .replace(/ies$/, 'y')
    .replace(/(inch)es$/, '$1')
    .replace(/s$/, '')
  return [unit.id, unit.symbol, unit.symbol.replace('°', ''), name, singular, name.replace(/s$/, '')]
}

/** Case matters first ("Mbps" vs "MBps"), then any case. */
function findUnit(word: string): { unit: Unit; category: Category } | null {
  const w = word.trim()
  if (!w) return null
  for (const exact of [true, false]) {
    for (const category of CATEGORIES) {
      for (const unit of category.units) {
        const hit = spellings(unit).some((s) => (exact ? s === w : s.toLowerCase() === w.toLowerCase()))
        if (hit) return { unit, category }
      }
    }
  }
  return null
}

function unitAnswer(input: string): QuickAnswer | null {
  const m = new RegExp(String.raw`^${NUMBER}\s*([^\d\s][^]*?)(?:\s+(?:to|in|into|as)\s+|\s*(?:->|→|=)\s*)(.+)$`, 'i').exec(input)
  const bare = m ? null : new RegExp(String.raw`^${NUMBER}\s*([^\d\s].*)$`, 'i').exec(input)
  const value = Number((m ?? bare)?.[1])
  const fromWord = (m ?? bare)?.[2]
  if (!fromWord || Number.isNaN(value)) return null

  const from = findUnit(fromWord)
  if (!from) return null

  let to: Unit | undefined
  if (m) {
    const target = findUnit(m[3])
    if (!target || target.category !== from.category) return null
    to = target.unit
  } else {
    // No target: use the category's usual partner, as the converter's shortcuts do.
    const pair = from.category.pairs.find(([a, b]) => a === from.unit.id || b === from.unit.id)
    const otherId = pair && (pair[0] === from.unit.id ? pair[1] : pair[0])
    to = from.category.units.find((u) => u.id === otherId)
  }
  if (!to || to === from.unit) return null

  const result = convert(value, from.unit, to)
  if (!Number.isFinite(result)) return null
  return {
    value: `${fmt(result)} ${to.symbol}`,
    detail: `${fmt(value)} ${from.unit.symbol} in ${to.name.toLowerCase()}`,
    toolPath: '/unit-converter',
  }
}

// --- Colours ----------------------------------------------------------------

function colourAnswer(input: string): QuickAnswer | null {
  const text = input.trim()
  // Only notations that can't be an ordinary search word: "#abc", "rgb(…)",
  // or six bare hex digits with at least one number in them ("1e90ff", not "facade").
  const looksLikeColour =
    text.startsWith('#') || /^[a-z-]+\(.*\)$/i.test(text) || (/^[0-9a-f]{6}$/i.test(text) && /\d/.test(text))
  if (!looksLikeColour) return null
  const parsed = parseColour(text)
  if (!parsed) return null
  const r = parseInt(parsed.hex.slice(1, 3), 16)
  const g = parseInt(parsed.hex.slice(3, 5), 16)
  const b = parseInt(parsed.hex.slice(5, 7), 16)
  return {
    value: parsed.hex,
    detail: `rgb(${r} ${g} ${b})${parsed.clipped ? ' · clipped to sRGB' : ''}`,
    toolPath: '/colour-picker',
    swatch: parsed.hex,
  }
}

// --- Unix timestamps --------------------------------------------------------

function timestampAnswer(input: string): QuickAnswer | null {
  // 10 digits is seconds (2001–2286), 13 is milliseconds.
  const m = /^(\d{10}|\d{13})$/.exec(input.trim())
  if (!m) return null
  const ms = m[1].length === 10 ? Number(m[1]) * 1000 : Number(m[1])
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null
  return {
    value: date.toISOString(),
    detail: `${date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })} · ${m[1].length === 10 ? 'seconds' : 'milliseconds'}`,
    toolPath: '/unix-timestamp-converter',
  }
}

// --- Percentages ------------------------------------------------------------

function percentAnswer(input: string): QuickAnswer | null {
  const text = input.trim().toLowerCase()
  const of = new RegExp(String.raw`^${NUMBER}\s*%\s*of\s*${NUMBER}$`).exec(text)
  if (of) {
    const [p, base] = [Number(of[1]), Number(of[2])]
    return { value: fmt((p / 100) * base), detail: `${fmt(p)}% of ${fmt(base)}`, toolPath: '/percentage-calculator' }
  }
  const change = new RegExp(String.raw`^${NUMBER}\s*([+-])\s*${NUMBER}\s*%$`).exec(text)
  if (change) {
    const [base, sign, p] = [Number(change[1]), change[2], Number(change[3])]
    const result = base * (1 + ((sign === '-' ? -1 : 1) * p) / 100)
    return {
      value: fmt(result),
      detail: `${fmt(base)} ${sign === '-' ? 'less' : 'plus'} ${fmt(p)}%`,
      toolPath: '/percentage-calculator',
    }
  }
  return null
}

/** Every answer the input gives, most specific first. */
export function quickAnswers(input: string): QuickAnswer[] {
  const text = input.trim()
  if (!text) return []
  return [colourAnswer, timestampAnswer, percentAnswer, unitAnswer]
    .map((answer) => answer(text))
    .filter((a): a is QuickAnswer => a !== null)
}

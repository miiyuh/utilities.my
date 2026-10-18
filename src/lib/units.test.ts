/// <reference types="bun" />
import { describe, expect, test } from 'bun:test'
import { CATEGORIES, convert, roundForDisplay, type Unit } from './units'

const unit = (category: string, id: string): Unit => {
  const u = CATEGORIES.find((c) => c.id === category)?.units.find((x) => x.id === id)
  if (!u) throw new Error(`No unit ${category}/${id}`)
  return u
}
const conv = (category: string, value: number, from: string, to: string) => convert(value, unit(category, from), unit(category, to))

// Known, exactly defined answers, one or two per category: [category, value, from, to, expected].
const KNOWN: [string, number, string, string, number][] = [
  ['length', 1, 'mi', 'km', 1.609344],
  ['length', 1, 'ft', 'in', 12],
  ['weight', 1, 'lb', 'g', 453.59237],
  ['weight', 1, 'st', 'lb', 14],
  ['temperature', 100, 'c', 'f', 212],
  ['temperature', -40, 'f', 'c', -40],
  ['temperature', 0, 'k', 'c', -273.15],
  ['volume', 1, 'gal', 'l', 3.785411784],
  ['volume', 1, 'cup', 'floz', 8],
  ['area', 1, 'ha', 'm2', 10_000],
  ['area', 1, 'ac', 'ft2', 43_560],
  ['speed', 100, 'kmh', 'ms', 27.7777777778],
  ['pressure', 1, 'atm', 'kpa', 101.325],
  ['energy', 1, 'kcal', 'kj', 4.184],
  ['fuel', 5, 'l100', 'kml', 20],
  ['fuel', 20, 'kml', 'l100', 5],
  ['time', 1, 'wk', 'h', 168],
  ['storage', 1, 'GiB', 'MiB', 1024],
  ['storage', 1, 'B', 'b', 8],
  ['data', 100, 'Mbps', 'MBps', 12.5],
]

describe('convert', () => {
  for (const [category, value, from, to, expected] of KNOWN) {
    test(`${category}: ${value} ${from} in ${to} is ${expected}`, () => {
      expect(conv(category, value, from, to)).toBeCloseTo(expected, 8)
    })
  }

  test('every unit converts to itself and back without drift', () => {
    for (const c of CATEGORIES) {
      for (const from of c.units) {
        for (const to of c.units) {
          const there = convert(12.5, from, to)
          expect(convert(there, to, from)).toBeCloseTo(12.5, 9)
        }
      }
    }
  })

  test('every unit has either a factor or both conversion functions', () => {
    for (const c of CATEGORIES) {
      for (const u of c.units) {
        expect(u.factor != null || (u.toBase != null && u.fromBase != null)).toBe(true)
      }
    }
  })

  test('shortcut pairs only name units that exist', () => {
    for (const c of CATEGORIES) {
      for (const [a, b] of c.pairs) {
        expect(c.units.some((u) => u.id === a) && c.units.some((u) => u.id === b)).toBe(true)
      }
    }
  })
})

describe('roundForDisplay', () => {
  test('rounds and trims trailing zeros', () => {
    expect(roundForDisplay(1.5, 2, false)).toBe('1.5')
    expect(roundForDisplay(2, 2, false)).toBe('2')
    expect(roundForDisplay(1.5, 2, true)).toBe('1.50')
  })

  test('never rounds a small non-zero answer to 0', () => {
    expect(roundForDisplay(0.000123456, 2, false)).toBe('0.000123')
  })

  test('shows 0, not -0', () => {
    expect(roundForDisplay(-0.0001, 2, false)).toBe('-0.0001')
    expect(roundForDisplay(-0, 2, false)).toBe('0')
  })

  test('returns empty for impossible answers', () => {
    expect(roundForDisplay(Infinity, 2, false)).toBe('')
    expect(roundForDisplay(Number.NaN, 2, false)).toBe('')
  })
})

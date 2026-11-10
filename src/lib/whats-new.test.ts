import { describe, expect, test } from 'bun:test'
import { UPDATES, hasUnseen } from './whats-new'

describe("what's new", () => {
  test('each update has a unique id, a real date, and something to say', () => {
    const ids = UPDATES.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const u of UPDATES) {
      expect(u.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(new Date(u.date).getTime())).toBe(false)
      expect(u.items.length).toBeGreaterThan(0)
    }
  })

  test('the newest is first', () => {
    const dates = UPDATES.map((u) => u.date)
    expect(dates.every((d, i) => i === 0 || dates[i - 1] >= d)).toBe(true)
  })

  test('shows the dot until the newest update has been seen', () => {
    expect(hasUnseen(UPDATES, null)).toBe(true)
    expect(hasUnseen(UPDATES, UPDATES[1].id)).toBe(true)
    expect(hasUnseen(UPDATES, UPDATES[0].id)).toBe(false)
    expect(hasUnseen([], null)).toBe(false)
  })
})

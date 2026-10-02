// Approximate shoe-size equivalents. Brands differ, so the foot-length column
// (the size of the foot each row fits) is the most reliable way in.

export type Category = 'men' | 'women' | 'kids'
export type SizeSystem = 'uk' | 'eu' | 'us'

export interface SizeRow {
  uk: string
  eu: string
  us: string
  /** Foot length in centimetres this size fits. */
  cm: number
}

const row = (us: string, uk: string, eu: string, cm: number): SizeRow => ({ us, uk, eu, cm })

export const SIZES: Record<Category, SizeRow[]> = {
  men: [
    row('6', '5.5', '38.5', 24), row('6.5', '6', '39', 24.5), row('7', '6.5', '40', 25), row('7.5', '7', '40.5', 25.5),
    row('8', '7.5', '41', 26), row('8.5', '8', '42', 26.5), row('9', '8.5', '42.5', 27), row('9.5', '9', '43', 27.5),
    row('10', '9.5', '44', 28), row('10.5', '10', '44.5', 28.5), row('11', '10.5', '45', 29), row('11.5', '11', '45.5', 29.5),
    row('12', '11.5', '46', 30), row('13', '12.5', '47.5', 31), row('14', '13.5', '49', 32),
  ],
  women: [
    row('5', '2.5', '35', 21.5), row('5.5', '3', '35.5', 22), row('6', '3.5', '36', 22.5), row('6.5', '4', '37', 23),
    row('7', '4.5', '37.5', 23.5), row('7.5', '5', '38', 24), row('8', '5.5', '38.5', 24.5), row('8.5', '6', '39', 25),
    row('9', '6.5', '40', 25.5), row('9.5', '7', '40.5', 26), row('10', '7.5', '41', 26.5), row('10.5', '8', '42', 27),
    row('11', '8.5', '42.5', 27.5), row('12', '9.5', '44', 28.5),
  ],
  kids: [
    row('10.5', '10', '27.5', 16.5), row('11', '10.5', '28', 17), row('11.5', '11', '29', 17.5), row('12', '11.5', '30', 18),
    row('12.5', '12', '30.5', 18.5), row('13', '12.5', '31', 19), row('13.5', '13', '31.5', 19.5), row('1', '13.5', '32', 20),
    row('1.5', '1', '33', 20.5), row('2', '1.5', '33.5', 21), row('2.5', '2', '34', 21.5), row('3', '2.5', '35', 22),
    row('3.5', '3', '35.5', 22.5), row('4', '3.5', '36', 23), row('4.5', '4', '36.5', 23.5), row('5', '4.5', '37', 24),
    row('5.5', '5', '37.5', 24.5), row('6', '5.5', '38', 25),
  ],
}

export interface LengthMatch {
  row: SizeRow
  index: number
  /** The foot sits between two sizes; this is the next size up. */
  between: boolean
  /** The foot is longer than the largest size in the chart. */
  beyond: boolean
}

/**
 * The size for a foot length: the smallest size that fits at least that
 * length (rounding up, since a shoe shorter than the foot won't fit).
 */
export function matchLength(category: Category, cm: number): LengthMatch | null {
  if (!Number.isFinite(cm) || cm <= 0) return null
  const rows = SIZES[category]
  // Tiny epsilon only for floating-point noise; a row shorter than the foot is never chosen.
  const index = rows.findIndex((r) => r.cm >= cm - 1e-9)
  if (index < 0) return { row: rows[rows.length - 1], index: rows.length - 1, between: false, beyond: true }
  return { row: rows[index], index, between: Math.abs(rows[index].cm - cm) > 1e-9, beyond: false }
}

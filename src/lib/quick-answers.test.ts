import { describe, expect, test } from 'bun:test'
import { quickAnswers } from './quick-answers'

const first = (q: string) => quickAnswers(q)[0]

describe('quickAnswers', () => {
  test.each([
    ['10 km to mi', '6.2137 mi'],
    ['10km in miles', '6.2137 mi'],
    ['100 f to c', '37.7778 °C'],
    ['100°F → °C', '37.7778 °C'],
    ['1 foot in cm', '30.48 cm'],
    ['2 in', '5.08 cm'],
    ['1 Gbps to Mbps', '1000 Mbps'],
    ['8 Mbps to MBps', '1 MB/s'],
  ])('%s is %s', (q, expected) => {
    expect(first(q)?.value).toBe(expected)
    expect(first(q)?.toolPath).toBe('/unit-converter')
  })

  test('refuses units from different categories', () => {
    expect(quickAnswers('10 km to kg')).toEqual([])
  })

  test.each([
    ['#1e90ff', '#1E90FF'],
    ['1e90ff', '#1E90FF'],
    ['rgb(255, 0, 0)', '#FF0000'],
    ['oklch(0.7 0.1 200)', expect.stringMatching(/^#[0-9A-F]{6}$/)],
  ])('reads %s as a colour', (q, hex) => {
    expect(first(q)).toMatchObject({ value: hex, toolPath: '/colour-picker' })
  })

  test('leaves ordinary words alone', () => {
    for (const q of ['facade', 'image', 'sort', 'red', 'time', 'qr', 'png to webp']) {
      expect(quickAnswers(q)).toEqual([])
    }
  })

  test('reads epoch seconds and milliseconds', () => {
    expect(first('1700000000')).toMatchObject({ value: '2023-11-14T22:13:20.000Z', toolPath: '/unix-timestamp-converter' })
    expect(first('1700000000000')?.value).toBe('2023-11-14T22:13:20.000Z')
  })

  test('works out percentages', () => {
    expect(first('20% of 150')).toMatchObject({ value: '30', toolPath: '/percentage-calculator' })
    expect(first('150 - 20%')?.value).toBe('120')
    expect(first('100 + 6%')?.value).toBe('106')
  })
})

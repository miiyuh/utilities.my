import { describe, expect, test } from 'bun:test'
import { hexForLink, hexParam, readQrLink } from './link-params'

describe('hexParam', () => {
  test.each([
    ['3eaf86', '#3EAF86'],
    ['#3EAF86', '#3EAF86'],
    ['fff', '#FFFFFF'],
    [' 000000 ', '#000000'],
    ['red', null],
    ['12345', null],
    [null, null],
  ])('%s → %s', (value, hex) => {
    expect(hexParam(value)).toBe(hex)
  })

  test('round-trips through a link', () => {
    expect(hexParam(hexForLink('#3EAF86'))).toBe('#3EAF86')
  })
})

describe('readQrLink', () => {
  test('reads colours and content', () => {
    expect(readQrLink(new URLSearchParams('fg=3eaf86&bg=fff&url=https://utilities.my'))).toEqual({
      fg: '#3EAF86',
      bg: '#FFFFFF',
      url: 'https://utilities.my',
    })
  })

  test('ignores colours it cannot read, and prefers a link to text', () => {
    expect(readQrLink(new URLSearchParams('fg=nope&text=hello'))).toEqual({ text: 'hello' })
    expect(readQrLink(new URLSearchParams('url=a&text=b'))).toEqual({ url: 'a' })
    expect(readQrLink(new URLSearchParams(''))).toEqual({})
  })
})

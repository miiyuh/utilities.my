import { describe, expect, test } from 'bun:test'
import { handOff, handoffCount, takeHandoff } from './file-handoff'

const file = (name: string) => new File(['x'], name)

describe('file hand-off', () => {
  test('the tool it was left for takes it, once', () => {
    handOff('/image-converter', [file('a.png'), file('b.png')])
    expect(handoffCount('/image-converter')).toBe(2)
    expect(takeHandoff('/favicon-generator')).toBeNull()
    expect(takeHandoff('/image-converter')?.map((f) => f.name)).toEqual(['a.png', 'b.png'])
    expect(takeHandoff('/image-converter')).toBeNull()
    expect(handoffCount('/image-converter')).toBe(0)
  })

  test('a newer hand-off replaces an older one', () => {
    handOff('/image-converter', [file('old.png')])
    handOff('/palang-ic', [file('ic.jpg')])
    expect(takeHandoff('/image-converter')).toBeNull()
    expect(takeHandoff('/palang-ic')?.[0]?.name).toBe('ic.jpg')
  })
})

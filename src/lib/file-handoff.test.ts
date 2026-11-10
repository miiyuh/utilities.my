import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { handOff, handoffCount, takeHandoff } from './file-handoff'
import { tools } from './tools'

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

describe('tools that receive files', () => {
  // Read the sources: a tool marked `receivesFiles` must pick up hand-offs for
  // its own path, or files sent to it would be lost, and the other way round.
  const root = join(import.meta.dir, '..')
  const sources = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? sources(join(dir, d.name)) : /\.tsx?$/.test(d.name) ? [readFileSync(join(dir, d.name), 'utf8')] : []
    )
  const code = sources(root).join('\n')

  test('match the code that picks up hand-offs', () => {
    for (const tool of tools) {
      expect({ tool: tool.path, picksUp: code.includes(`handoff: '${tool.path}'`) }).toEqual({
        tool: tool.path,
        picksUp: Boolean(tool.receivesFiles),
      })
    }
  })
})

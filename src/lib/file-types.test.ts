import { describe, expect, test } from 'bun:test'
import { MIME, acceptsFile, extensionFor, fileMatch, parseFileQuery } from './file-types'
import { tools } from './tools'

/** Names of the tools that fit a search, best first. */
function toolsFor(query: string): string[] {
  const parsed = parseFileQuery(query)
  if (!parsed) return []
  return tools
    .map((t) => ({ t, fit: fileMatch(t, parsed) }))
    .filter((x) => x.fit > 0)
    .sort((a, b) => b.fit - a.fit)
    .map((x) => x.t.name)
}

describe('tool file types', () => {
  test('every listed type is a known extension', () => {
    for (const tool of tools) {
      for (const ext of [...(tool.accepts ?? []), ...(tool.produces ?? [])]) {
        expect({ tool: tool.name, ext, known: ext in MIME }).toEqual({ tool: tool.name, ext, known: true })
      }
    }
  })
})

describe('extensionFor', () => {
  test.each([
    ['png', '.png'],
    ['.PNG', '.png'],
    ['*.jpeg', '.jpeg'],
    ['jpeg xl', '.jxl'],
    ['resize', null],
    ['heic', null],
  ])('%s → %s', (word, ext) => {
    expect(extensionFor(word)).toBe(ext)
  })
})

describe('file searches', () => {
  test('a conversion finds the tools that open one type and save the other', () => {
    expect(toolsFor('png to ico')).toEqual(['Image Converter', 'Favicon Generator'])
    expect(toolsFor('jpeg → webp')).toEqual(['Image Converter'])
    expect(toolsFor('convert png into ico')).toEqual(['Image Converter', 'Favicon Generator'])
  })

  test('.jpg and .jpeg are the same type', () => {
    expect(toolsFor('jpg to jpeg')).toEqual(toolsFor('jpeg to jpg'))
    expect(toolsFor('jpg to jpeg')).toContain('Image Converter')
  })

  test('a conversion nothing can do finds nothing', () => {
    expect(toolsFor('heic to jpg')).toEqual([])
    expect(toolsFor('pdf to png')).toEqual([])
    // Palang IC saves PDFs, but only of a stamped IC: it waits for the PDF tools.
    expect(toolsFor('jpg to pdf')).toEqual([])
  })

  test('a single type puts tools that open and save it first', () => {
    const png = toolsFor('png')
    expect(png[0]).toBe('Image Converter')
    expect(png).toEqual(expect.arrayContaining(['Colour Picker', 'QR Code Generator', 'Favicon Generator', 'Palang IC']))
    expect(toolsFor('.md')).toEqual(['Markdown Previewer', 'Text Statistics'])
  })

  test('ordinary searches are not file searches', () => {
    for (const q of ['resize', 'time zone', 'sort a list', '10 km to mi']) expect(parseFileQuery(q)).toBeNull()
  })
})

describe('acceptsFile', () => {
  const converter = tools.find((t) => t.path === '/image-converter')!

  test('reads the extension, in any case', () => {
    expect(acceptsFile(converter, { name: 'IMG_0001.JPG', type: '' })).toBe(true)
    expect(acceptsFile(converter, { name: 'notes.txt', type: 'text/plain' })).toBe(false)
  })

  test('falls back to the MIME type for pasted files with no extension', () => {
    expect(acceptsFile(converter, { name: 'image', type: 'image/png' })).toBe(true)
    expect(acceptsFile(converter, { name: 'image', type: 'image/heic' })).toBe(false)
  })
})

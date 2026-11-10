import { describe, expect, test } from 'bun:test'
import { fileProblem, pickerAccept, sortFiles, typeList } from './file-intake'
import { toolAccepts } from './tools'

const file = (name: string, type = '', size = 1000) => ({ name, type, size })
const images = { accepts: toolAccepts('/image-converter') }

describe('typeList', () => {
  test('names each type once, in plain words', () => {
    expect(typeList(['.png', '.jpg', '.jpeg', '.webp'])).toBe('PNG, JPEG or WebP')
    expect(typeList(['.md', '.markdown', '.txt'])).toBe('Markdown or plain text')
    expect(typeList(['.png'])).toBe('PNG')
  })
})

describe('pickerAccept', () => {
  test('lists extensions and MIME types, each once', () => {
    expect(pickerAccept(['.jpg', '.jpeg'])).toBe('.jpg,image/jpeg,.jpeg')
  })
})

describe('fileProblem', () => {
  test('accepts the types the tool lists', () => {
    expect(fileProblem(file('photo.JPG'), images)).toBeNull()
    expect(fileProblem(file('scan.tiff'), images)).toBeNull()
  })

  test('accepts a pasted image that has no extension', () => {
    expect(fileProblem(file('image', 'image/png'), images)).toBeNull()
  })

  test('explains HEIC photos', () => {
    expect(fileProblem(file('IMG_0042.HEIC', 'image/heic'), images)).toContain('HEIC photo')
  })

  test('names the types it takes when the file is the wrong kind', () => {
    expect(fileProblem(file('notes.txt', 'text/plain'), { accepts: ['.png', '.jpg'] })).toBe(
      "notes.txt can't be opened here. Use PNG or JPEG."
    )
  })

  test('turns away files over the limit', () => {
    expect(fileProblem(file('huge.png', 'image/png', 60 * 1024 * 1024), images)).toBe('huge.png is larger than 50 MB.')
    expect(fileProblem(file('small.png', 'image/png', 2000), { ...images, maxBytes: 1024 * 1024 })).toBeNull()
  })
})

describe('sortFiles', () => {
  test('keeps the usable files and a reason for each of the others', () => {
    const { accepted, problems } = sortFiles([file('a.png'), file('b.pdf'), file('c.webp')], images)
    expect(accepted.map((f) => f.name)).toEqual(['a.png', 'c.webp'])
    expect(problems).toHaveLength(1)
    expect(problems[0]).toStartWith('b.pdf')
  })
})

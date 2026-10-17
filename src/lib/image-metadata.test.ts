/// <reference types="bun" />
import { describe, expect, test } from 'bun:test'
import { canKeepMetadata, carryOverMetadata, metadataOverhead } from './image-metadata'

// A tiny hand-built JPEG whose EXIF holds an orientation, a pixel size, a GPS
// latitude and an embedded thumbnail. Offsets are from the start of the TIFF
// header, little-endian. The GPS and thumbnail bytes are distinctive so the
// tests can check they are gone from the output, not just unlinked.
const GPS_BYTES = [0x47, 0x50, 0x53, 0x21, 0x13, 0x37, 0xbe, 0xef] // "GPS!" + marker
const THUMB_BYTE = 0xab

function buildTiff(): Uint8Array {
  const b = new Uint8Array(172)
  const v = new DataView(b.buffer)
  const u16 = (o: number, x: number) => v.setUint16(o, x, true)
  const u32 = (o: number, x: number) => v.setUint32(o, x, true)
  const entry = (o: number, tag: number, type: number, count: number, value: number) => {
    u16(o, tag)
    u16(o + 2, type)
    u32(o + 4, count)
    if (type === 3 && count === 1) u16(o + 8, value)
    else u32(o + 8, value)
  }

  b.set([0x49, 0x49]) // "II"
  u16(2, 42)
  u32(4, 8) // IFD0

  // IFD0 at 8: orientation, Exif IFD pointer, GPS IFD pointer; next = IFD1.
  u16(8, 3)
  entry(10, 0x0112, 3, 1, 6) // Orientation: rotated
  entry(22, 0x8769, 4, 1, 50) // Exif IFD
  entry(34, 0x8825, 4, 1, 80) // GPS IFD
  u32(46, 134) // IFD1

  // Exif IFD at 50: pixel width and height of the original.
  u16(50, 2)
  entry(52, 0xa002, 4, 1, 4000)
  entry(64, 0xa003, 4, 1, 3000)
  u32(76, 0)

  // GPS IFD at 80: latitude ref (inline "N") and latitude (3 rationals at 110).
  u16(80, 2)
  entry(82, 0x0001, 2, 2, 0x4e) // "N\0"
  entry(94, 0x0002, 5, 3, 110)
  u32(106, 0)
  for (let i = 0; i < 24; i++) b[110 + i] = GPS_BYTES[i % GPS_BYTES.length]

  // IFD1 at 134: thumbnail offset and length; thumbnail bytes at 164.
  u16(134, 2)
  entry(136, 0x0201, 4, 1, 164)
  entry(148, 0x0202, 4, 1, 8)
  u32(160, 0)
  b.fill(THUMB_BYTE, 164, 172)
  return b
}

function buildJpeg(): Blob {
  const tiff = buildTiff()
  const exifHeader = new TextEncoder().encode('Exif\0\0')
  const len = 2 + exifHeader.length + tiff.length
  const app1 = new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...exifHeader, ...tiff])
  const scan = new Uint8Array([0xff, 0xda, 0x00, 0x02, 0x00, 0xff, 0xd9])
  return new Blob([new Uint8Array([0xff, 0xd8]), app1, scan], { type: 'image/jpeg' })
}

/** A re-encoded output as the canvas would give it: no metadata at all. */
const bareOutput = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })

const bytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer())

function contains(haystack: Uint8Array, needle: number[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let k = 0; k < needle.length; k++) if (haystack[i + k] !== needle[k]) continue outer
    return true
  }
  return false
}

/** Reads IFD0 of the EXIF segment that `carryOverMetadata` put after SOI. */
function readIfd0(out: Uint8Array) {
  const T = 2 + 10 // SOI, then FF E1 + length + "Exif\0\0"
  const v = new DataView(out.buffer, out.byteOffset + T)
  const ifd0 = v.getUint32(4, true)
  const count = v.getUint16(ifd0, true)
  const tags = new Map<number, number>()
  for (let k = 0; k < count; k++) {
    const e = ifd0 + 2 + k * 12
    const type = v.getUint16(e + 2, true)
    tags.set(v.getUint16(e, true), type === 3 ? v.getUint16(e + 8, true) : v.getUint32(e + 8, true))
  }
  const next = v.getUint32(ifd0 + 2 + count * 12, true)
  const exifIfd = tags.get(0x8769)
  const exif = new Map<number, number>()
  if (exifIfd) {
    for (let k = 0; k < v.getUint16(exifIfd, true); k++) {
      const e = exifIfd + 2 + k * 12
      exif.set(v.getUint16(e, true), v.getUint32(e + 8, true))
    }
  }
  return { tags, next, exif }
}

const size = { width: 800, height: 600 }

describe('carryOverMetadata', () => {
  test('keep-no-location removes GPS and wipes its bytes', async () => {
    const out = await bytes(await carryOverMetadata(buildJpeg(), bareOutput(), 'keep-no-location', size))
    const { tags } = readIfd0(out)
    expect(tags.has(0x8825)).toBe(false)
    expect(contains(out, GPS_BYTES)).toBe(false)
  })

  test('keep-all keeps GPS', async () => {
    const out = await bytes(await carryOverMetadata(buildJpeg(), bareOutput(), 'keep-all', size))
    expect(readIfd0(out).tags.has(0x8825)).toBe(true)
    expect(contains(out, GPS_BYTES)).toBe(true)
  })

  test.each(['keep-all', 'keep-no-location'] as const)('%s resets orientation, updates size and drops the thumbnail', async (mode) => {
    const out = await bytes(await carryOverMetadata(buildJpeg(), bareOutput(), mode, size))
    const { tags, next, exif } = readIfd0(out)
    expect(tags.get(0x0112)).toBe(1)
    expect(exif.get(0xa002)).toBe(800)
    expect(exif.get(0xa003)).toBe(600)
    expect(next).toBe(0)
    expect(contains(out, Array(8).fill(THUMB_BYTE))).toBe(false)
  })

  test('strip returns the output unchanged', async () => {
    const output = bareOutput()
    expect(await carryOverMetadata(buildJpeg(), output, 'strip', size)).toBe(output)
  })

  test('nothing is carried into a non-JPEG output', async () => {
    const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' })
    expect(await carryOverMetadata(buildJpeg(), png, 'keep-all', size)).toBe(png)
    expect(canKeepMetadata(buildJpeg(), 'image/webp')).toBe(false)
  })

  test('metadataOverhead matches the bytes actually added', async () => {
    const overhead = await metadataOverhead(buildJpeg(), 'image/jpeg', 'keep-no-location')
    const out = await carryOverMetadata(buildJpeg(), bareOutput(), 'keep-no-location', size)
    expect(out.size - bareOutput().size).toBe(overhead)
  })
})

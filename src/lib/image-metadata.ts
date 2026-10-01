// Reads the metadata embedded in an image so people can see exactly what a
// file carries before they share it, and optionally puts it back into a JPEG
// output (canvas re-encoding always strips it). The reader loads on demand.

export interface MetadataItem {
  label: string
  value: string
}

export interface MetadataGroup {
  title: string
  items: MetadataItem[]
  /** Highlighted as sensitive in the UI (e.g. location). */
  sensitive?: boolean
}

export interface MetadataReport {
  groups: MetadataGroup[]
  /** Every tag found, for the "all tags" view. */
  raw: MetadataItem[]
  hasLocation: boolean
}

export type MetadataMode = 'strip' | 'keep-no-location' | 'keep-all'

function fmt(value: unknown): string {
  if (value instanceof Date) {
    return value.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  }
  if (Array.isArray(value)) return value.map(fmt).join(', ')
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) return `${value instanceof Uint8Array ? value.length : value.byteLength} bytes of binary data`
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(Math.round(value * 10000) / 10000)
  return String(value)
}

function exposure(t: unknown): string | null {
  if (typeof t !== 'number' || t <= 0) return null
  return t >= 1 ? `${t} s` : `1/${Math.round(1 / t)} s`
}

/**
 * Parses EXIF, GPS, IPTC and XMP. Returns null when the file has none (or the
 * format can't carry it), which the UI reports plainly.
 */
export async function readMetadata(file: Blob): Promise<MetadataReport | null> {
  const { default: exifr } = await import('exifr')
  let data: Record<string, unknown> | undefined
  try {
    data = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: true,
      icc: false,
      ifd1: false,
      interop: false,
      makerNote: false,
      translateValues: true,
      reviveValues: true,
      mergeOutput: true,
    })) as Record<string, unknown> | undefined
  } catch {
    return null
  }
  if (!data || Object.keys(data).length === 0) return null

  const pick = (...keys: string[]) => keys.map((k) => data[k]).find((v) => v !== undefined && v !== null && v !== '')
  const group = (title: string, entries: [string, unknown][], sensitive = false): MetadataGroup | null => {
    const items = entries.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([label, v]) => ({ label, value: fmt(v) }))
    return items.length ? { title, items, sensitive } : null
  }

  const lat = typeof data.latitude === 'number' ? data.latitude : undefined
  const lon = typeof data.longitude === 'number' ? data.longitude : undefined
  const hasLocation = lat !== undefined && lon !== undefined

  const groups = [
    group(
      'Location',
      [
        ['Coordinates', hasLocation ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : undefined],
        ['Altitude', typeof data.GPSAltitude === 'number' ? `${Math.round(data.GPSAltitude)} m` : undefined],
        ['City', pick('City', 'city')],
        ['Country', pick('Country', 'country', 'CountryName')],
      ],
      true
    ),
    group('Camera', [
      ['Make', pick('Make')],
      ['Model', pick('Model')],
      ['Lens', pick('LensModel', 'Lens')],
      ['Serial number', pick('SerialNumber', 'BodySerialNumber')],
    ]),
    group('Capture', [
      ['Taken', pick('DateTimeOriginal', 'CreateDate')],
      ['Exposure', exposure(data.ExposureTime)],
      ['Aperture', typeof data.FNumber === 'number' ? `f/${data.FNumber}` : undefined],
      ['ISO', pick('ISO', 'ISOSpeedRatings')],
      ['Focal length', typeof data.FocalLength === 'number' ? `${data.FocalLength} mm` : undefined],
      ['Flash', pick('Flash')],
    ]),
    group('Authorship', [
      ['Artist', pick('Artist', 'creator', 'Creator', 'By-line')],
      ['Copyright', pick('Copyright', 'rights', 'CopyrightNotice')],
      ['Description', pick('ImageDescription', 'description', 'Caption-Abstract')],
    ]),
    group('Software', [
      ['Software', pick('Software', 'CreatorTool')],
      ['Last modified', pick('ModifyDate')],
    ]),
  ].filter((g): g is MetadataGroup => g !== null)

  const raw = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([label, v]) => ({ label, value: fmt(v) }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return { groups, raw, hasLocation }
}

// ---------------------------------------------------------------------------
// Keeping metadata (JPEG only)
// ---------------------------------------------------------------------------

// The source's EXIF segment is copied byte for byte and patched in place, so
// every tag (including maker notes and unusual value types) survives intact.

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 }

/** Finds the APP1 "Exif" segment of a JPEG: [start, end) including marker and length. */
function findExifSegment(b: Uint8Array): [number, number] | null {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null
  let i = 2
  while (i + 4 <= b.length && b[i] === 0xff) {
    const marker = b[i + 1]
    if (marker === 0xda || marker === 0xd9) break // start of scan / end of image
    const len = (b[i + 2] << 8) | b[i + 3]
    const isExif =
      marker === 0xe1 && b[i + 4] === 0x45 && b[i + 5] === 0x78 && b[i + 6] === 0x69 && b[i + 7] === 0x66 && b[i + 8] === 0 && b[i + 9] === 0
    if (isExif) return [i, i + 2 + len]
    i += 2 + len
  }
  return null
}

/**
 * Patches a copy of an EXIF segment: resets orientation, updates pixel size,
 * drops the embedded thumbnail, and optionally deletes GPS. Removed data is
 * zeroed, not just unlinked, so it can't be recovered from leftover bytes.
 */
function patchExif(segment: Uint8Array, opts: { removeLocation: boolean; width: number; height: number }): Uint8Array {
  const seg = segment.slice()
  const T = 10 // TIFF header starts after FF E1, the length and "Exif" plus two zero bytes
  const view = new DataView(seg.buffer, seg.byteOffset, seg.byteLength)
  const le = seg[T] === 0x49 // "II" little-endian, "MM" big-endian
  const u16 = (o: number) => view.getUint16(T + o, le)
  const u32 = (o: number) => view.getUint32(T + o, le)
  const set16 = (o: number, v: number) => view.setUint16(T + o, v, le)
  const set32 = (o: number, v: number) => view.setUint32(T + o, v, le)
  const zero = (o: number, n: number) => seg.fill(0, T + o, Math.min(seg.length, T + o + n))
  const inBounds = (o: number, n: number) => o >= 0 && T + o + n <= seg.length

  /** Zeroes an IFD's entries and any out-of-line values they point to. */
  const wipeIfd = (ifd: number) => {
    if (!inBounds(ifd, 2)) return
    const count = u16(ifd)
    for (let k = 0; k < count; k++) {
      const e = ifd + 2 + k * 12
      if (!inBounds(e, 12)) break
      const bytes = (TYPE_SIZE[u16(e + 2)] ?? 1) * u32(e + 4)
      if (bytes > 4 && inBounds(u32(e + 8), bytes)) zero(u32(e + 8), bytes)
    }
    zero(ifd, 2 + count * 12 + 4)
  }

  /** Sets a SHORT/LONG tag's value in an IFD, if present. */
  const setValue = (ifd: number, tag: number, value: number) => {
    const count = u16(ifd)
    for (let k = 0; k < count; k++) {
      const e = ifd + 2 + k * 12
      if (u16(e) !== tag) continue
      if (u16(e + 2) === 3) set16(e + 8, value)
      else if (u16(e + 2) === 4) set32(e + 8, value)
    }
  }

  const ifd0 = u32(4)
  if (!inBounds(ifd0, 2)) return seg
  const count0 = u16(ifd0)
  setValue(ifd0, 0x0112, 1) // Orientation: pixels are already upright

  let exifIfd = 0
  for (let k = 0; k < count0; k++) {
    const e = ifd0 + 2 + k * 12
    if (u16(e) === 0x8769) exifIfd = u32(e + 8)
  }
  if (exifIfd && inBounds(exifIfd, 2)) {
    setValue(exifIfd, 0xa002, opts.width)
    setValue(exifIfd, 0xa003, opts.height)
  }

  if (opts.removeLocation) {
    for (let k = 0; k < u16(ifd0); k++) {
      const e = ifd0 + 2 + k * 12
      if (u16(e) !== 0x8825) continue
      wipeIfd(u32(e + 8))
      // Remove the GPS pointer entry: shift the rest up, shrink the count.
      const n = u16(ifd0)
      const tail = ifd0 + 2 + n * 12 // next-IFD offset follows the entries
      seg.copyWithin(T + e, T + e + 12, T + tail + 4)
      zero(tail - 12 + 4, 12)
      set16(ifd0, n - 1)
      break
    }
  }

  // Drop IFD1 (the embedded thumbnail would still show the unedited image).
  const next = ifd0 + 2 + u16(ifd0) * 12
  const ifd1 = inBounds(next, 4) ? u32(next) : 0
  if (ifd1 && inBounds(ifd1, 2)) {
    let thumbAt = 0
    let thumbLen = 0
    for (let k = 0; k < u16(ifd1); k++) {
      const e = ifd1 + 2 + k * 12
      if (u16(e) === 0x0201) thumbAt = u32(e + 8)
      if (u16(e) === 0x0202) thumbLen = u32(e + 8)
    }
    if (thumbAt && inBounds(thumbAt, thumbLen)) zero(thumbAt, thumbLen)
    wipeIfd(ifd1)
    set32(next, 0)
  }
  return seg
}

/** Metadata can only be carried over JPEG → JPEG; other formats store it differently. */
export function canKeepMetadata(source: Blob, outputType: string): boolean {
  return source.type === 'image/jpeg' && outputType === 'image/jpeg'
}

/**
 * Copies the source JPEG's EXIF into the output JPEG. Orientation is reset
 * (the pixels are already upright), the old thumbnail is dropped (it would
 * show the unedited image), and location is removed unless asked to keep it.
 */
export async function carryOverMetadata(
  source: Blob,
  output: Blob,
  mode: MetadataMode,
  size: { width: number; height: number }
): Promise<Blob> {
  if (mode === 'strip' || !canKeepMetadata(source, output.type)) return output
  const src = new Uint8Array(await source.arrayBuffer())
  const out = new Uint8Array(await output.arrayBuffer())
  const at = findExifSegment(src)
  if (!at || out[0] !== 0xff || out[1] !== 0xd8) return output
  try {
    const segment = patchExif(src.subarray(at[0], at[1]), { removeLocation: mode === 'keep-no-location', ...size })
    // Insert straight after the output's SOI marker.
    return new Blob([out.slice(0, 2), segment.slice(), out.slice(2)], { type: "image/jpeg" })
  } catch {
    // Unreadable EXIF: the clean output is still a valid file.
    return output
  }
}

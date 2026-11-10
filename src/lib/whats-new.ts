// What's new: changes in plain words, written by hand. CHANGELOG.md is made
// from commit messages and reads like them, so it isn't shown to people.
//
// Add new entries at the top. Give each one an id that never changes; the
// header shows a dot until the newest id has been seen.

export interface Update {
  /** Stable and unique; the newest one seen is remembered. */
  id: string
  /** ISO date, yyyy-MM-dd. */
  date: string
  title: string
  items: string[]
  fixes?: string[]
}

export const UPDATES: Update[] = [
  {
    id: '2026-11-tools-together',
    date: '2026-11-10',
    title: 'Tools that work together',
    items: [
      'Search answers as you type. Try “10 km to mi”, “#1e90ff”, a Unix timestamp or “20% of 150”, then press Enter to copy the answer.',
      'Search finds tools by file type too, such as “png to ico” or “.md”.',
      'Drop or paste a file on the home page, or into search, to see which tools can open it.',
      'Send a converted image straight to Favicon Generator, Palang IC or Colour Picker, and a colour from Colour Picker to a QR code.',
      'The site works offline after your first visit. When a new version is ready, you choose when to reload.',
      'Favicon Generator takes a dropped image, and Palang IC a pasted photo.',
    ],
    fixes: [
      'World Clock no longer keeps retrying the time zone map when it can’t load, and the emoji picker can try again after a failure.',
      'Palang IC handles front and back photos added at the same time.',
      'Morse Code Generator: pausing, editing while paused and changing the speed now work as you’d expect.',
      'Image Converter keeps your image open if a new one can’t be opened.',
    ],
  },
  {
    id: '2026-10-image-formats',
    date: '2026-10-24',
    title: 'More image formats',
    items: ['Image Converter saves GIF, BMP, TIFF and ICO, as well as PNG, JPEG, WebP, AVIF and JPEG XL.'],
  },
  {
    id: '2026-10-accessibility',
    date: '2026-10-23',
    title: 'Accessibility settings',
    items: [
      'Larger text, an easier-to-read or dyslexia-friendly font, more text spacing, higher contrast, underlined links and less motion, from the button at the top of every page.',
    ],
  },
]

export const SEEN_KEY = 'utilities.my-whats-new-seen'

/** Whether there's an update newer than the last one seen. */
export function hasUnseen(updates: Update[], seenId: string | null): boolean {
  return updates.length > 0 && updates[0].id !== seenId
}

export function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY)
  } catch {
    return null
  }
}

export function markSeen(updates: Update[]): void {
  if (!updates.length) return
  try {
    localStorage.setItem(SEEN_KEY, updates[0].id)
  } catch {
    // Storage unavailable: the dot just comes back next visit.
  }
}

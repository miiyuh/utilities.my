// Reading and accessibility preferences. Each one is mirrored onto <html> as a
// data attribute and styled purely in CSS (a11y.css), so nothing re-renders.
// main.tsx applies the stored values before React's first render, and the app
// renders nothing before that, so there is no flash.

export const TEXT_SIZES = ['100', '115', '130', '150'] as const
export const READING_FONTS = ['default', 'legible', 'dyslexic'] as const

export type TextSize = (typeof TEXT_SIZES)[number]
export type ReadingFont = (typeof READING_FONTS)[number]

export type A11yPreferences = {
  textSize: TextSize
  font: ReadingFont
  spacing: boolean
  contrast: boolean
  underlineLinks: boolean
  reduceMotion: boolean
}

export type A11yToggle = 'spacing' | 'contrast' | 'underlineLinks' | 'reduceMotion'

export const A11Y_TOGGLES: A11yToggle[] = ['spacing', 'contrast', 'underlineLinks', 'reduceMotion']
const PREFERENCE_KEYS: (keyof A11yPreferences)[] = ['textSize', 'font', ...A11Y_TOGGLES]

export const isTextSize = (value: unknown): value is TextSize =>
  TEXT_SIZES.some((size) => size === value)
export const isReadingFont = (value: unknown): value is ReadingFont =>
  READING_FONTS.some((font) => font === value)

export const DEFAULT_A11Y_PREFERENCES: A11yPreferences = {
  textSize: '100',
  font: 'default',
  spacing: false,
  contrast: false,
  underlineLinks: false,
  reduceMotion: false,
}

const STORAGE_KEY = 'utilities.my-a11y'
const CHANGE_EVENT = 'a11y-preferences-change'

// Preference -> attribute on <html>. Default values remove the attribute.
const ATTRIBUTES: Record<keyof A11yPreferences, string> = {
  textSize: 'data-a11y-text-size',
  font: 'data-a11y-font',
  spacing: 'data-a11y-spacing',
  contrast: 'data-a11y-contrast',
  underlineLinks: 'data-a11y-underline-links',
  reduceMotion: 'data-a11y-reduce-motion',
}

// The reading fonts are only downloaded once someone picks them.
const FONT_LOADERS: Record<Exclude<ReadingFont, 'default'>, () => Promise<unknown>> = {
  legible: () => import('@fontsource-variable/atkinson-hyperlegible-next'),
  dyslexic: () => Promise.all([import('@fontsource/opendyslexic/400.css'), import('@fontsource/opendyslexic/700.css')]),
}

function sanitize(raw: unknown): A11yPreferences {
  const value: Partial<Record<string, unknown>> = raw && typeof raw === 'object' ? raw : {}
  const bool = (key: A11yToggle) => {
    const stored = value[key]
    return typeof stored === 'boolean' ? stored : DEFAULT_A11Y_PREFERENCES[key]
  }
  return {
    textSize: isTextSize(value.textSize) ? value.textSize : DEFAULT_A11Y_PREFERENCES.textSize,
    font: isReadingFont(value.font) ? value.font : DEFAULT_A11Y_PREFERENCES.font,
    spacing: bool('spacing'),
    contrast: bool('contrast'),
    underlineLinks: bool('underlineLinks'),
    reduceMotion: bool('reduceMotion'),
  }
}

// Cached so useSyncExternalStore gets a stable snapshot between changes.
let cachedRaw: string | null | undefined
let cachedPreferences = DEFAULT_A11Y_PREFERENCES

export function readA11yPreferences(): A11yPreferences {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode, disabled cookies): fall back to defaults.
  }
  if (raw === cachedRaw) return cachedPreferences
  cachedRaw = raw
  try {
    cachedPreferences = sanitize(raw ? JSON.parse(raw) : null)
  } catch {
    cachedPreferences = DEFAULT_A11Y_PREFERENCES
  }
  return cachedPreferences
}

export function applyA11yPreferences(preferences: A11yPreferences) {
  const root = document.documentElement
  for (const key of PREFERENCE_KEYS) {
    const value = preferences[key]
    if (value === DEFAULT_A11Y_PREFERENCES[key]) root.removeAttribute(ATTRIBUTES[key])
    else root.setAttribute(ATTRIBUTES[key], String(value))
  }
  if (preferences.font !== 'default') void FONT_LOADERS[preferences.font]()
}

export function writeA11yPreferences(preferences: A11yPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Not saved, but still applied for this visit.
  }
  applyA11yPreferences(preferences)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeToA11yPreferences(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    // Another tab changed the preferences: apply them here too.
    if (event.key === STORAGE_KEY) applyA11yPreferences(readA11yPreferences())
    onChange()
  }
  window.addEventListener('storage', handleStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

/** True when the OS asks for reduced motion or the user turned on "Reduce motion". */
export function prefersReducedMotion(): boolean {
  return (
    document.documentElement.hasAttribute(ATTRIBUTES.reduceMotion) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

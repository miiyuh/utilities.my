import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  MagnifyingGlass,
  Gear,
  Info,
  ShieldCheck,
  BookOpen,
  Moon,
  Sun,
  Link as LinkIcon,
  Keyboard,
  ClockCounterClockwise,
  type Icon,
} from 'phosphor-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { tools } from '@/lib/tools'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Search data
// ---------------------------------------------------------------------------

/** Extra words people might type for each tool (synonyms, units, use cases). */
const KEYWORDS: Record<string, string[]> = {
  '/text-case': ['uppercase', 'lowercase', 'title', 'camel', 'snake', 'kebab', 'capitalise'],
  '/colour-picker': ['color', 'hex', 'rgb', 'hsl', 'oklch', 'cmyk', 'eyedropper', 'palette', 'contrast'],
  '/unit-converter': ['length', 'weight', 'temperature', 'celsius', 'fahrenheit', 'km', 'miles', 'kg', 'pounds'],
  '/bmi-calculator': ['body mass', 'weight', 'height', 'health'],
  '/image-converter': ['png', 'jpg', 'jpeg', 'webp', 'avif', 'resize', 'compress', 'crop', 'exif'],
  '/markdown-previewer': ['md', 'editor', 'html', 'preview'],
  '/qr-code-generator': ['qr', 'barcode', 'link', 'wifi', 'url'],
  '/unix-timestamp-converter': ['epoch', 'unix', 'timestamp', 'seconds', 'milliseconds'],
  '/timezone-converter': ['time zone', 'meeting', 'gmt', 'utc', 'schedule'],
  '/world-clock': ['globe', 'map', 'time', 'cities', 'day night'],
  '/date-diff-calculator': ['days between', 'age', 'countdown', 'duration'],
  '/text-statistics': ['word count', 'character count', 'reading time'],
  '/sorter': ['sort', 'alphabetical', 'shuffle', 'dedupe', 'list'],
  '/spin-the-wheel': ['random', 'picker', 'decide', 'raffle', 'roulette'],
  '/morse-code-generator': ['morse', 'sos', 'dots', 'dashes', 'translate'],
  '/percentage-calculator': ['percent', 'discount', 'tip', 'increase', 'decrease'],
  '/foot-size-converter': ['shoe', 'size', 'us', 'uk', 'eu'],
  '/palang-ic': ['mykad', 'ic', 'watermark', 'identity card', 'pdf'],
  '/favicon-generator': ['favicon', 'icon', 'ico', 'apple touch', 'manifest', 'pwa'],
}

const RECENTS_KEY = 'utilities.my-recent-tools'
const MAX_RECENTS = 5

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : []
  } catch {
    return []
  }
}

function rememberRecent(path: string) {
  try {
    const next = [path, ...readRecents().filter((p) => p !== path)].slice(0, MAX_RECENTS)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable: recents just won't persist.
  }
}

/** Higher is better; 0 means no match. Name matches beat keyword matches. */
function score(query: string, name: string, extra: string[]): number {
  const q = query.toLowerCase().trim()
  if (!q) return 1
  const n = name.toLowerCase()
  if (n.startsWith(q)) return 100
  if (n.split(/\s+/).some((w) => w.startsWith(q))) return 80
  if (n.includes(q)) return 60
  if (extra.some((k) => k.startsWith(q))) return 50
  if (extra.some((k) => k.includes(q))) return 35
  // Loose subsequence ("uts" → "Unix Timestamp"): last resort.
  let i = 0
  for (const ch of n) if (ch === q[i]) i++
  return i === q.length ? 10 : 0
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PaletteContext {
  openPalette: () => void
  openShortcuts: () => void
}

const Ctx = React.createContext<PaletteContext | null>(null)

export function useCommandPalette() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  return ctx
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const MOD_KEY = isMac ? '⌘' : 'Ctrl'

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
}

// ---------------------------------------------------------------------------
// Provider: global shortcuts + dialogs
// ---------------------------------------------------------------------------

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { pathname } = useLocation()

  React.useEffect(() => {
    if (tools.some((t) => t.path === pathname && t.path !== '/')) rememberRecent(pathname)
  }, [pathname])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShortcutsOpen(false)
        setPaletteOpen((o) => !o)
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
        return
      }
      if (isTypingTarget(e.target) || mod || e.altKey) return
      if (e.key === '/') {
        e.preventDefault()
        setPaletteOpen(true)
      } else if (e.key === '?') {
        e.preventDefault()
        setPaletteOpen(false)
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [resolvedTheme, setTheme])

  const value = React.useMemo(
    () => ({ openPalette: () => setPaletteOpen(true), openShortcuts: () => setShortcutsOpen(true) }),
    []
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <PaletteDialog
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onShowShortcuts={() => {
          setPaletteOpen(false)
          setShortcutsOpen(true)
        }}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </Ctx.Provider>
  )
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

interface Entry {
  id: string
  group: 'Recent' | 'Tools' | 'Pages' | 'Actions'
  label: string
  hint?: string
  icon: Icon
  keywords: string[]
  shortcut?: string
  run: () => void
}

function PaletteDialog({
  open,
  onOpenChange,
  onShowShortcuts,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShowShortcuts: () => void
}) {
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const { toast } = useToast()
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)
  const [recents, setRecents] = React.useState<string[]>([])

  React.useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setRecents(readRecents())
    }
  }, [open])

  const go = React.useCallback(
    (path: string) => {
      onOpenChange(false)
      void navigate(path)
    },
    [navigate, onOpenChange]
  )

  const entries = React.useMemo<Entry[]>(() => {
    const toolEntries: Entry[] = tools
      .filter((t) => t.path !== '/')
      .map((t) => ({
        id: t.path,
        group: 'Tools',
        label: t.name,
        hint: t.description,
        icon: t.icon,
        keywords: KEYWORDS[t.path] ?? [],
        run: () => go(t.path),
      }))
    const pages: Entry[] = [
      { id: '/', group: 'Pages', label: 'Home', icon: tools[0].icon, keywords: ['all tools', 'start'], run: () => go('/') },
      { id: '/settings', group: 'Pages', label: 'Settings', icon: Gear, keywords: ['preferences', 'units', 'format'], run: () => go('/settings') },
      { id: '/about', group: 'Pages', label: 'About & how the tools work', icon: Info, keywords: ['methodology', 'sources', 'formulas'], run: () => go('/about') },
      { id: '/privacy', group: 'Pages', label: 'Privacy Policy', icon: ShieldCheck, keywords: ['data', 'analytics'], run: () => go('/privacy') },
      { id: '/terms', group: 'Pages', label: 'Terms of Service', icon: BookOpen, keywords: ['legal', 'rules'], run: () => go('/terms') },
    ]
    const actions: Entry[] = [
      {
        id: 'theme',
        group: 'Actions',
        label: resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: resolvedTheme === 'dark' ? Sun : Moon,
        keywords: ['theme', 'dark', 'light', 'mode'],
        shortcut: `${MOD_KEY} ⇧ L`,
        run: () => {
          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
          onOpenChange(false)
        },
      },
      {
        id: 'copy-link',
        group: 'Actions',
        label: 'Copy link to this page',
        icon: LinkIcon,
        keywords: ['share', 'url', 'copy'],
        run: () => {
          onOpenChange(false)
          void navigator.clipboard.writeText(window.location.href).then(
            () => toast({ title: 'Link copied', description: window.location.href }),
            () => toast({ title: 'Copy failed', description: 'Unable to copy to clipboard.', variant: 'destructive' })
          )
        },
      },
      {
        id: 'shortcuts',
        group: 'Actions',
        label: 'Show keyboard shortcuts',
        icon: Keyboard,
        keywords: ['keys', 'help', 'hotkeys'],
        shortcut: '⇧ /',
        run: onShowShortcuts,
      },
    ]
    return [...toolEntries, ...pages, ...actions]
  }, [go, resolvedTheme, setTheme, onOpenChange, onShowShortcuts, toast])

  const results = React.useMemo<Entry[]>(() => {
    const q = query.trim()
    if (!q) {
      const recent = recents
        .map((p) => entries.find((e) => e.id === p && e.group === 'Tools'))
        .filter((e): e is Entry => Boolean(e))
        .map((e) => ({ ...e, id: `recent:${e.id}`, group: 'Recent' as const, icon: e.icon }))
      return [...recent, ...entries]
    }
    return entries
      .map((e) => ({ e, s: score(q, e.label, e.keywords) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e)
  }, [query, entries, recents])

  React.useEffect(() => setActive(0), [query])

  React.useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (results.length ? (i + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Home') {
      setActive(0)
    } else if (e.key === 'End') {
      setActive(Math.max(0, results.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[active]?.run()
    }
  }

  // Group headers are shown when the group changes between consecutive rows.
  const rows = results.map((entry, i) => ({
    entry,
    header: i === 0 || results[i - 1].group !== entry.group ? entry.group : null,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Search tools and actions</DialogTitle>
          <DialogDescription>Type to filter, use the arrow keys to move, Enter to open.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <MagnifyingGlass className="h-4 w-4 shrink-0 text-muted-foreground" />
          {/* Radix moves focus to this input (the first focusable) when the dialog opens. */}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tools and actions…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            aria-autocomplete="list"
          />
          <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">Esc</kbd>
        </div>
        <div
          ref={listRef}
          id="palette-list"
          // Combobox pattern: a native <select>/<datalist> can't hold rich rows.
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="listbox"
          aria-label="Results" className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nothing matches “{query}”. Try a tool name or what you want to do, like “resize” or “epoch”.
            </p>
          )}
          {rows.map(({ entry, header }, i) => {
            const EntryIcon = entry.group === 'Recent' ? ClockCounterClockwise : entry.icon
            return (
              <React.Fragment key={entry.id}>
                {header && (
                  <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-1">
                    {header}
                  </div>
                )}
                <div
                  id={`palette-${entry.id}`}
                  data-index={i}
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                  role="option"
                  aria-selected={i === active}
                  tabIndex={-1}
                  onMouseMove={() => setActive(i)}
                  onClick={entry.run}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') entry.run()
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-quick',
                    i === active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  )}
                >
                  <EntryIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{entry.label}</div>
                    {entry.hint && <div className="truncate text-xs text-muted-foreground">{entry.hint}</div>}
                  </div>
                  {entry.shortcut && (
                    <kbd className="shrink-0 rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {entry.shortcut}
                    </kbd>
                  )}
                </div>
              </React.Fragment>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <span><kbd className="font-mono">↑↓</kbd> move</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
          {/* "?" (Shift + /) is the usual help key, as on GitHub, Gmail and YouTube. */}
          <button type="button" onClick={onShowShortcuts} className="ml-auto inline-flex items-center gap-1.5 underline-offset-2 hover:text-foreground hover:underline">
            Keyboard shortcuts <kbd className="rounded-md border border-border px-1 font-mono">⇧ /</kbd>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Shortcuts sheet
// ---------------------------------------------------------------------------

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: [MOD_KEY, 'K'], label: 'Search tools and actions' },
  { keys: ['/'], label: 'Search (when not typing)' },
  { keys: [MOD_KEY, '⇧', 'L'], label: 'Switch light / dark theme' },
  { keys: ['⇧', '/'], label: 'Show these shortcuts (the ? key)' },
  { keys: ['↑', '↓'], label: 'Move through search results' },
  { keys: ['↵'], label: 'Open the selected result' },
  { keys: ['Esc'], label: 'Close a dialog' },
]

function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" /> Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>Work faster without reaching for the mouse.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-border">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span>{s.label}</span>
              <span className="flex shrink-0 gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="min-w-6 rounded-md border border-border bg-muted px-1.5 py-0.5 text-center font-mono text-xs">
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Header trigger
// ---------------------------------------------------------------------------

export function SearchButton() {
  const { openPalette } = useCommandPalette()
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openPalette}
        className="hidden h-8 gap-2 pr-1.5 pl-3 text-muted-foreground sm:inline-flex"
        aria-label="Search tools"
      >
        <MagnifyingGlass className="h-4 w-4" />
        <span className="text-sm">Search</span>
        <kbd className="rounded-full border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">{MOD_KEY} K</kbd>
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={openPalette} className="sm:hidden" title="Search tools">
        <MagnifyingGlass className="h-4 w-4" />
      </Button>
    </>
  )
}

import * as React from 'react'
import { MagnifyingGlass, Spinner } from 'phosphor-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface EmojiItem {
  /** The emoji itself. */
  e: string
  /** CLDR short name, e.g. "waving hand". */
  n: string
  /** Emoji version it was introduced in. */
  v: string
  /** Five skin-tone variants (light → dark), when the emoji supports them. */
  t?: string[]
}

interface EmojiData {
  version: string
  groups: { name: string; emoji: EmojiItem[] }[]
}

let cache: Promise<EmojiData> | null = null
function loadEmoji(): Promise<EmojiData> {
  cache ??= fetch('/data/emoji.json').then((r) => {
    if (!r.ok) throw new Error('Could not load the emoji list.')
    return r.json() as Promise<EmojiData>
  })
  return cache
}

const TONES = ['', '🏻', '🏼', '🏽', '🏾', '🏿']
const TONE_SWATCH = ['#ffcc4d', '#f7dece', '#f3d2a2', '#d5ab88', '#af7e57', '#7c533e']
const EMOJI_FONT = "'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"

/**
 * Every emoji in the current Unicode release (from emoji-test.txt), with
 * search, categories and skin tones. The list loads only when opened.
 */
export function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<EmojiData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')
  const [group, setGroup] = React.useState(0)
  const [tone, setTone] = React.useState(0)
  const [hovered, setHovered] = React.useState<EmojiItem | null>(null)

  React.useEffect(() => {
    if (!open || data) return
    loadEmoji().then(setData, (e: unknown) => setError(e instanceof Error ? e.message : 'Could not load emoji.'))
  }, [open, data])

  const withTone = (it: EmojiItem) => (tone > 0 && it.t ? it.t[tone - 1] : it.e)

  const results = React.useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (!q) return data.groups[group]?.emoji ?? []
    const words = q.split(/\s+/)
    return data.groups.flatMap((g) => g.emoji).filter((it) => words.every((w) => it.n.includes(w))).slice(0, 400)
  }, [data, query, group])

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          setQuery('')
          setHovered(null)
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Choose an emoji (current: ${value || 'none'})`}
          className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm transition-colors duration-quick hover:bg-muted/60"
        >
          <span className="text-2xl leading-none" style={{ fontFamily: EMOJI_FONT }}>{value || '🙂'}</span>
          <span className="text-muted-foreground">Browse all emoji</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <MagnifyingGlass className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji, e.g. coffee, rocket, cat"
            aria-label="Search emoji"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {data && !query && (
          <div className="flex gap-0.5 overflow-x-auto border-b border-border px-1.5 py-1" role="tablist" aria-label="Emoji categories">
            {data.groups.map((g, i) => (
              <button
                key={g.name}
                type="button"
                role="tab"
                aria-selected={group === i}
                aria-label={g.name}
                onClick={() => setGroup(i)}
                className={cn('size-8 shrink-0 rounded-md text-lg transition-colors duration-quick', group === i ? 'bg-accent' : 'hover:bg-muted/60')}
                style={{ fontFamily: EMOJI_FONT }}
              >
                {g.emoji[0]?.e}
              </button>
            ))}
          </div>
        )}
        <div className="h-72 overflow-y-auto p-1.5">
          {error && <p className="p-4 text-sm text-destructive">{error}</p>}
          {!data && !error && (
            <p className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4 animate-spin" /> Loading emoji…
            </p>
          )}
          {data && results.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No emoji match “{query}”.</p>}
          {data && (
            <div className="grid grid-cols-8 gap-0.5">
              {results.map((it) => {
                const e = withTone(it)
                return (
                  <button
                    key={it.e}
                    type="button"
                    aria-label={it.n}
                    onMouseEnter={() => setHovered(it)}
                    onFocus={() => setHovered(it)}
                    onClick={() => {
                      onChange(e)
                      setOpen(false)
                    }}
                    className={cn('aspect-square rounded-md text-2xl leading-none transition-colors duration-quick hover:bg-accent focus-visible:bg-accent focus-visible:outline-none', value === e && 'bg-primary/15')}
                    style={{ fontFamily: EMOJI_FONT }}
                  >
                    {e}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-border px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {hovered ? (
              <>
                <span style={{ fontFamily: EMOJI_FONT }}>{withTone(hovered)}</span> {hovered.n}
                <span className="opacity-60"> · Emoji {hovered.v}</span>
              </>
            ) : data ? (
              `${data.groups.reduce((n, g) => n + g.emoji.length, 0)} emoji · Unicode ${data.version}`
            ) : null}
          </span>
          <fieldset className="flex shrink-0 gap-1">
            <legend className="sr-only">Skin tone</legend>
            {TONES.map((t, i) => (
              <button
                key={i}
                type="button"
                aria-label={i === 0 ? 'Default skin tone' : `Skin tone ${i}`}
                aria-pressed={tone === i}
                onClick={() => setTone(i)}
                className={cn('size-4 rounded-full border', tone === i ? 'ring-2 ring-primary ring-offset-1 ring-offset-popover' : 'border-border')}
                style={{ background: TONE_SWATCH[i] }}
              />
            ))}
          </fieldset>
        </div>
      </PopoverContent>
    </Popover>
  )
}

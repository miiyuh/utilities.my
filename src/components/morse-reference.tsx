import * as React from 'react'
import { Hint } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Dots and dashes drawn as shapes, so the rhythm is easy to see at a glance. */
export function MorseSymbols({ code, className }: { code: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-[2px]', className)} aria-hidden>
      {code.split('').map((s, i) =>
        s === '.' ? (
          <span key={i} className="inline-block size-1.5 rounded-full bg-current" />
        ) : s === '-' ? (
          <span key={i} className="inline-block h-1.5 w-3 rounded-full bg-current" />
        ) : null
      )}
    </span>
  )
}

const GROUPS: { title: string; test: (c: string) => boolean }[] = [
  { title: 'Letters', test: (c) => /^[A-Z]$/.test(c) },
  { title: 'Numbers', test: (c) => /^[0-9]$/.test(c) },
  { title: 'Punctuation', test: (c) => !/^[A-Z0-9 ]$/.test(c) },
]

/**
 * The full Morse alphabet. Each entry plays its sound and adds itself to the
 * current input when picked, so people can learn and type in one place.
 */
export function MorseReference({
  map,
  onPick,
}: {
  map: Record<string, string>
  onPick: (char: string, code: string) => void
}) {
  const entries = Object.entries(map)
  return (
    <div className="space-y-6">
      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <p>
          <strong className="text-foreground">Dots and dashes.</strong> A dot is a short beep. A dash lasts three dots.
        </p>
        <p>
          <strong className="text-foreground">Gaps matter.</strong> One dot of silence inside a letter, three between letters,
          seven between words (written as <code className="font-mono">/</code>).
        </p>
        <p>
          <strong className="text-foreground">Start small.</strong> E is a single dot and T a single dash. SOS is{' '}
          <span className="font-mono text-foreground">... --- ...</span>.
        </p>
      </div>
      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
            {entries
              .filter(([char]) => group.test(char))
              .map(([char, code]) => (
                <Hint key={char} label={`${char}  ${code}  (click to hear and add)`}>
                  <button
                    type="button"
                    onClick={() => onPick(char, code)}
                    className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-2 transition-colors duration-quick hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                    aria-label={`${char}: ${code.replace(/\./g, 'dot ').replace(/-/g, 'dash ').trim()}`}
                  >
                    <span className="font-mono text-base font-semibold leading-none text-foreground">{char}</span>
                    <MorseSymbols code={code} className="text-muted-foreground" />
                  </button>
                </Hint>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Read-only translation shown as chips: each letter's code with its letter in a
 * tooltip (or the other way round), so the output doubles as a lesson.
 */
export function MorseChips({
  pairs,
  placeholder,
  show,
}: {
  /** [char, code] per character; words are separated by [' ', '/']. */
  pairs: [string, string][]
  placeholder: string
  /** Which side is the visible text; the other goes in the tooltip. */
  show: 'code' | 'char'
}) {
  if (pairs.length === 0) {
    return (
      <div className="min-h-[200px] rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{placeholder}</div>
    )
  }
  return (
    <div className="min-h-[200px] rounded-md bg-muted/50 px-3 py-2 font-mono text-sm leading-8 break-words">
      {pairs.map(([char, code], i) =>
        char === ' ' ? (
          <span key={i} className="mx-1 text-muted-foreground">/</span>
        ) : (
          <Hint key={i} label={show === 'code' ? char : code}>
            <button
              type="button"
              className={cn(
                'mr-1.5 inline-flex h-7 items-center rounded-md px-1.5 font-mono outline-none transition-colors duration-quick hover:bg-accent focus-visible:bg-accent',
                !code && 'text-muted-foreground'
              )}
            >
              {show === 'code' ? (
                code ? (
                  <>
                    <MorseSymbols code={code} className="align-middle" />
                    <span className="sr-only">{char}</span>
                  </>
                ) : (
                  char
                )
              ) : (
                char
              )}
            </button>
          </Hint>
        )
      )}
    </div>
  )
}

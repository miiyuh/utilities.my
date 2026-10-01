import * as React from 'react'
import { Globe } from 'phosphor-react'
import { cn } from '@/lib/utils'

/**
 * ISO 3166-1 alpha-2 code ("my") from a flag emoji ("🇲🇾"). Flag emoji are two
 * regional-indicator symbols, one per letter. Returns null for anything else.
 */
export function flagCode(emoji: string | undefined): string | null {
  if (!emoji) return null
  const points: number[] = []
  for (let i = 0; i < emoji.length; ) {
    const point = emoji.codePointAt(i) ?? 0
    points.push(point)
    i += point > 0xffff ? 2 : 1
  }
  if (points.length !== 2 || points.some((p) => p < 0x1f1e6 || p > 0x1f1ff)) return null
  return points.map((p) => String.fromCharCode(p - 0x1f1e6 + 97)).join('')
}

/**
 * Country flag as an image from the REST Countries flag CDN (keyless).
 * Emoji flags don't render on Windows, and render inconsistently elsewhere.
 * Falls back to a globe for unknown codes or if the image fails to load.
 */
export function Flag({ emoji, code, className }: { emoji?: string; code?: string; className?: string }) {
  const cc = (code ?? flagCode(emoji))?.toLowerCase() ?? null
  const [failed, setFailed] = React.useState(false)

  if (!cc || failed) {
    return <Globe aria-hidden className={cn('inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground', className)} />
  }
  return (
    <img
      src={`https://flags.restcountries.com/v5/svg/${cc}.svg`}
      alt=""
      aria-hidden
      width={20}
      height={14}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      // Flags differ in shape (Switzerland 1:1, Qatar 2.5:1). A fixed slot keeps
      // labels aligned; object-contain shows each flag whole, pinned left. The
      // drop-shadow outlines the flag itself (not the slot) so white flags show.
      className={cn('inline-block h-3.5 w-5 shrink-0 object-contain object-left drop-shadow-[0_0_0.5px_rgb(0_0_0/0.45)]', className)}
    />
  )
}

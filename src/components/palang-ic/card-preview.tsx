import { useEffect, useRef, useState } from 'react'
import { IdentificationCard } from 'phosphor-react'
import {
  ID1_RATIO,
  drawZoneGuides,
  renderWatermarkedCard,
  type CardSide,
  type SideKey,
  type WatermarkOptions,
  type ZoneCoverage,
} from '@/lib/palang-ic'

interface CardPreviewProps {
  label: 'Front' | 'Back'
  sideKey: SideKey
  side: CardSide | null
  options: WatermarkOptions
  fontsReady: boolean
  /** Zone outlines to draw over the preview only. Memoise in the parent: a new array restarts the debounce. */
  guides?: ZoneCoverage[]
}

const DEBOUNCE_MS = 150

/**
 * Live preview of one watermarked side. Renders the full 300 dpi card off
 * screen and scales it onto a DPR-sized visible canvas, debounced so slider
 * drags stay smooth. Export never reuses this canvas; it re-renders so the
 * output can never lag behind the debounce.
 */
export function CardPreview({ label, sideKey, side, options, fontsReady, guides }: CardPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const [cssW, setCssW] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setCssW(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!side || !cssW) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      rafRef.current = window.requestAnimationFrame(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(cssW * dpr)
        canvas.height = Math.round((cssW / ID1_RATIO) * dpr)
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        try {
          const full = renderWatermarkedCard(side, options, sideKey)
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(full, 0, 0, canvas.width, canvas.height)
          if (guides?.length) drawZoneGuides(ctx, canvas.width, canvas.height, guides, dpr)
        } catch (error) {
          console.error('Preview render failed:', error)
        }
      })
    }, DEBOUNCE_MS)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [side, sideKey, options, cssW, fontsReady, guides])

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/40"
        style={{ aspectRatio: `${ID1_RATIO}` }}
      >
        {side ? (
          <canvas
            ref={canvasRef}
            // A canvas is the image here; there is no <img> to prefer.
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="img"
            aria-label={`${label} preview with watermark`}
            className="absolute inset-0 h-full w-full animate-in fade-in duration-fast"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <IdentificationCard className="h-7 w-7" />
            <span className="text-xs">No {label.toLowerCase()} added</span>
          </div>
        )}
      </div>
    </div>
  )
}

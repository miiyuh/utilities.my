import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Before/after comparison: the "after" image is revealed from the left up to
 * the handle. A native range input drives it, so dragging, tapping and the
 * keyboard all work without custom pointer code.
 */
export function CompareSlider({
  before,
  after,
  beforeLabel = 'Original',
  afterLabel = 'Output',
  className,
}: {
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}) {
  const [pos, setPos] = React.useState(50)
  return (
    <div className={cn('relative overflow-hidden rounded-md border border-border outline-none has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 bg-[conic-gradient(var(--muted)_25%,transparent_0_50%,var(--muted)_0_75%,transparent_0)] bg-[length:16px_16px]', className)}>
      <img src={before} alt={beforeLabel} className="block h-full w-full object-contain" draggable={false} />
      <img
        src={after}
        alt={afterLabel}
        className="absolute inset-0 block h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.25)]" style={{ left: `calc(${pos}% - 1px)` }} aria-hidden>
        <div className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-semibold text-black shadow">
          ⇆
        </div>
      </div>
      <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">{afterLabel}</span>
      <span className="pointer-events-none absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">{beforeLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Compare ${afterLabel.toLowerCase()} with ${beforeLabel.toLowerCase()}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}

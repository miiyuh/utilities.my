import * as React from 'react'
import { ArrowCounterClockwise, Play } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { randomInt } from '@/lib/random'

type ConfettiLauncher = (options?: Record<string, unknown>) => unknown

interface SpinWheelProps {
  items: string[]
  onSpin: (winner: string) => void
  disabled?: boolean
}

const VIEW = 1000
const C = VIEW / 2
const R = 480
const LABEL_OUTER = R * 0.9
const LABEL_INNER = R * 0.17
const SPIN_MS = 4800

/**
 * Evenly spaced hues starting at pandan green, alternating lightness so
 * neighbours never blend. Light slices get dark text and vice versa.
 */
function sliceColour(i: number, n: number) {
  const hue = (165 + (360 / n) * i) % 360
  const light = i % 2 === 0
  return {
    fill: `oklch(${light ? 0.8 : 0.58} 0.12 ${hue.toFixed(1)})`,
    text: light ? 'oklch(0.22 0.02 60)' : 'oklch(0.98 0.01 80)',
  }
}

function polar(angleDeg: number, radius: number): [number, number] {
  // 0deg points straight up; angles grow clockwise.
  const a = ((angleDeg - 90) * Math.PI) / 180
  return [C + radius * Math.cos(a), C + radius * Math.sin(a)]
}

function slicePath(start: number, end: number): string {
  const [x1, y1] = polar(start, R)
  const [x2, y2] = polar(end, R)
  const large = end - start > 180 ? 1 : 0
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`
}

export function SpinWheel({ items, onSpin, disabled = false }: SpinWheelProps) {
  const [rotation, setRotation] = React.useState(0)
  const [spinning, setSpinning] = React.useState(false)
  // The highlighted slice, tagged with the list it belongs to so an edited list drops it.
  const [winnerMark, setWinnerMark] = React.useState<{ index: number; list: string } | null>(null)
  const [announcement, setAnnouncement] = React.useState('')
  // Kept separately: "remove winners" can drop the winner from items right away.
  const [lastWinner, setLastWinner] = React.useState<string | null>(null)
  /** The spin in progress: the picked index and the list it indexes, as they were when it started. */
  const pending = React.useRef<{ index: number; items: string[] } | null>(null)
  const confetti = React.useRef<ConfettiLauncher | null>(null)
  const wheelRef = React.useRef<HTMLDivElement>(null)

  const reducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  React.useEffect(() => {
    void import('canvas-confetti').then((mod) => {
      confetti.current = mod.default || mod
    })
  }, [])

  const listKey = items.join('\n')
  const winnerIndex = winnerMark && winnerMark.list === listKey ? winnerMark.index : null
  const n = items.length
  const slice = n > 0 ? 360 / n : 360

  // One font size for every label: limited by the slice's width at mid-radius
  // and by the item count, so the wheel reads evenly.
  const fontSize = n > 0 ? Math.max(18, Math.min(46, 2 * (R * 0.55) * Math.sin(Math.PI / n) * 0.5, 50 - n * 1.4)) : 40
  const maxChars = Math.max(3, Math.floor((LABEL_OUTER - LABEL_INNER) / (fontSize * 0.56)))

  const finish = React.useCallback(() => {
    const spun = pending.current
    if (!spun) return
    pending.current = null
    // Read from the list the spin started with; the items may have been edited since.
    const winner = spun.items[spun.index]
    setSpinning(false)
    setWinnerMark({ index: spun.index, list: spun.items.join('\n') })
    setLastWinner(winner)
    setAnnouncement(`The wheel picked ${winner}.`)
    const rect = wheelRef.current?.getBoundingClientRect()
    if (confetti.current && rect && !reducedMotion) {
      confetti.current({
        particleCount: 90,
        spread: 70,
        origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 3) / window.innerHeight },
      })
    }
    onSpin(winner)
  }, [onSpin, reducedMotion])

  const spin = () => {
    if (disabled || spinning || n < 2) return
    const idx = randomInt(n)
    // Land somewhere inside the winning slice, not always dead centre.
    const offset = (randomInt(1000) / 1000 - 0.5) * slice * 0.7
    const target = idx * slice + slice / 2 + offset
    const current = ((rotation % 360) + 360) % 360
    const delta = (((360 - target - current) % 360) + 360) % 360
    pending.current = { index: idx, items: [...items] }
    setWinnerMark(null)
    setAnnouncement('Spinning…')
    setSpinning(true)
    setRotation(rotation + (reducedMotion ? 0 : 360 * (5 + randomInt(3))) + delta)
    if (reducedMotion) window.setTimeout(finish, 50)
  }

  const label = (text: string) => (text.length > maxChars ? `${text.slice(0, maxChars - 1).trimEnd()}…` : text)

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div ref={wheelRef} className="relative w-full max-w-[min(100%,30rem)]">
        {/* Pointer, fixed at the top */}
        <svg viewBox="0 0 40 40" className="absolute left-1/2 top-0 z-10 h-9 w-9 -translate-x-1/2 -translate-y-1 drop-shadow" aria-hidden>
          <path d="M20 38 L6 6 Q20 0 34 6 Z" className="fill-foreground stroke-background" strokeWidth="2" strokeLinejoin="round" />
        </svg>

        <button
          type="button"
          onClick={spin}
          disabled={disabled || spinning || n < 2}
          aria-label={n < 2 ? 'Add at least two items to spin' : 'Spin the wheel'}
          className="block w-full rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:cursor-default"
        >
          <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="block w-full select-none" aria-hidden>
            <circle cx={C} cy={C} r={R + 14} className="fill-card stroke-border" strokeWidth="4" />
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '50% 50%',
                transition: spinning && !reducedMotion ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.72, 0.16, 1)` : 'none',
              }}
              onTransitionEnd={(e) => {
                if (e.target === e.currentTarget && e.propertyName === 'transform') finish()
              }}
            >
              {n === 0 ? (
                <circle cx={C} cy={C} r={R} className="fill-muted" />
              ) : n === 1 ? (
                <circle cx={C} cy={C} r={R} fill={sliceColour(0, 1).fill} />
              ) : (
                items.map((item, i) => {
                  const start = i * slice
                  const mid = start + slice / 2
                  const { fill, text } = sliceColour(i, n)
                  const dimmed = winnerIndex != null && winnerIndex !== i
                  const [lx, ly] = polar(mid, LABEL_OUTER)
                  return (
                    <g key={i} style={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity var(--duration-medium) var(--ease-smooth-out)' }}>
                      <path d={slicePath(start, start + slice)} fill={fill} className="stroke-card" strokeWidth="3">
                        <title>{item}</title>
                      </path>
                      <text
                        x={lx}
                        y={ly}
                        transform={`rotate(${mid + 90} ${lx} ${ly})`}
                        textAnchor="start"
                        dominantBaseline="central"
                        fill={text}
                        style={{ fontFamily: 'var(--font-heading)', fontSize, fontWeight: 600 }}
                      >
                        {label(item)}
                      </text>
                    </g>
                  )
                })
              )}
            </g>
            {/* Hub */}
            <circle cx={C} cy={C} r={58} className="fill-card stroke-border" strokeWidth="4" />
            <circle cx={C} cy={C} r={18} className="fill-primary" />
            {n < 2 && (
              <text
                x={C}
                y={C + 130}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontFamily: 'var(--font-heading)', fontSize: 34 }}
              >
                Add at least two items
              </text>
            )}
          </svg>
        </button>
      </div>

      <Button onClick={spin} disabled={disabled || spinning || n < 2} size="lg" className="min-w-36">
        {spinning ? (
          <>
            <ArrowCounterClockwise className="h-4 w-4 animate-spin" /> Spinning…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" /> Spin the wheel
          </>
        )}
      </Button>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {lastWinner != null && !spinning && (
        <div className={cn('text-center animate-in fade-in-0 zoom-in-95 duration-fast ease-smooth-out')}>
          <p className="text-sm text-muted-foreground">The wheel picked</p>
          <p className="font-heading text-2xl font-semibold text-foreground">{lastWinner}</p>
        </div>
      )}
    </div>
  )
}

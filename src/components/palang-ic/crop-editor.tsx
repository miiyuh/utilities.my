import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ArrowCounterClockwise, ArrowClockwise, ArrowsOutSimple } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  ID1_RATIO,
  MIN_CROP_W,
  clamp,
  defaultCrop,
  drawRotated,
  rotatedSize,
  type CardSide,
  type CropRect,
  type Rotation,
} from '@/lib/palang-ic'

interface CropEditorProps {
  side: CardSide
  rotation: Rotation
  crop: CropRect
  onChange: (next: { rotation: Rotation; crop: CropRect }) => void
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'
const CORNER_SIGNS: Record<Corner, [number, number]> = {
  tl: [-1, -1],
  tr: [1, -1],
  bl: [-1, 1],
  br: [1, 1],
}
const CORNER_LABELS: Record<Corner, string> = {
  tl: 'top-left',
  tr: 'top-right',
  bl: 'bottom-left',
  br: 'bottom-right',
}

interface DragState {
  mode: 'move' | Corner
  startX: number
  startY: number
  startCrop: CropRect
  boxW: number
  boxH: number
}

/**
 * Aspect-locked crop rectangle over the rotated source image. The move
 * surface and the four corner handles are real buttons so keyboard users get
 * focus and arrow-key control without role/tabIndex hacks; they are siblings,
 * not nested, so no interactive content ends up inside a button.
 */
export function CropEditor({ side, rotation, crop, onChange }: CropEditorProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [boxSize, setBoxSize] = useState<{ w: number; h: number } | null>(null)

  const [rw, rh] = rotatedSize(side.width, side.height, rotation)

  // Measure inside the observer, not on mount: the Radix dialog is still
  // animating in when this component first renders.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect && rect.width > 0) setBoxSize({ w: rect.width, h: rect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Redraw the background only when rotation or size changes; the crop
  // overlay itself is pure CSS.
  useEffect(() => {
    const canvas = bgRef.current
    if (!canvas || !boxSize) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(boxSize.w * dpr)
    canvas.height = Math.round(boxSize.h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingQuality = 'high'
    drawRotated(ctx, side.source, side.width, side.height, rotation, canvas.width, canvas.height)
  }, [side, rotation, boxSize])

  /** Aspect lock in normalised units: h = w * k. */
  const k = boxSize ? boxSize.w / (boxSize.h * ID1_RATIO) : 1 / ID1_RATIO

  const resize = (start: CropRect, corner: Corner, dx: number, dy: number): CropRect => {
    const [sx, sy] = CORNER_SIGNS[corner]
    const ax = sx > 0 ? start.x : start.x + start.w
    const ay = sy > 0 ? start.y : start.y + start.h
    let w = Math.max(start.w + sx * dx, (start.h + sy * dy) / k)
    w = clamp(w, MIN_CROP_W, sx > 0 ? 1 - ax : ax)
    w = Math.min(w, (sy > 0 ? 1 - ay : ay) / k)
    const h = w * k
    return { x: sx > 0 ? ax : ax - w, y: sy > 0 ? ay : ay - h, w, h }
  }

  const move = (start: CropRect, dx: number, dy: number): CropRect => ({
    ...start,
    x: clamp(start.x + dx, 0, 1 - start.w),
    y: clamp(start.y + dy, 0, 1 - start.h),
  })

  const onPointerDown = (mode: DragState['mode']) => (e: PointerEvent<HTMLButtonElement>) => {
    if (!boxSize) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startCrop: crop, boxW: boxSize.w, boxH: boxSize.h }
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) / d.boxW
    const dy = (e.clientY - d.startY) / d.boxH
    const next = d.mode === 'move' ? move(d.startCrop, dx, dy) : resize(d.startCrop, d.mode, dx, dy)
    onChange({ rotation, crop: next })
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const onKeyDown = (mode: DragState['mode']) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01
    let next: CropRect | null = null
    if (mode === 'move') {
      if (e.key === 'ArrowLeft') next = move(crop, -step, 0)
      else if (e.key === 'ArrowRight') next = move(crop, step, 0)
      else if (e.key === 'ArrowUp') next = move(crop, 0, -step)
      else if (e.key === 'ArrowDown') next = move(crop, 0, step)
    } else {
      const [sx, sy] = CORNER_SIGNS[mode]
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = resize(crop, mode, sx * step, sy * step)
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = resize(crop, mode, -sx * step, -sy * step)
    }
    if (next) {
      e.preventDefault()
      onChange({ rotation, crop: next })
    }
  }

  const rotate = (delta: 90 | -90) => {
    const nextRotation = (((rotation + delta) % 360) + 360) % 360 as Rotation
    const [nrw, nrh] = rotatedSize(side.width, side.height, nextRotation)
    // Carrying the old rectangle through the rotation would swap its aspect
    // and break the lock, so a reset is the honest behaviour.
    onChange({ rotation: nextRotation, crop: defaultCrop(nrw, nrh) })
  }

  const pct = (v: number) => `${v * 100}%`

  return (
    <div className="space-y-3">
      <div
        ref={wrapRef}
        className="relative mx-auto w-full select-none [-webkit-user-select:none]"
        // Width derives from the height cap so the box always keeps the
        // image's aspect; a plain max-height would stretch the canvas.
        style={{ aspectRatio: `${rw} / ${rh}`, width: `min(100%, calc(60vh * ${rw / rh}))`, touchAction: 'none' }}
      >
        {/* Clipped layer: the image and the dark shade around the crop. */}
        <div className="absolute inset-0 overflow-hidden rounded-md bg-muted">
          <canvas
            ref={bgRef}
            // A canvas is the image here; there is no <img> to prefer.
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="img"
            aria-label="Uploaded image, rotated"
            className="absolute inset-0 h-full w-full"
          />
          <div
            className="pointer-events-none absolute shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
            style={{ left: pct(crop.x), top: pct(crop.y), width: pct(crop.w), height: pct(crop.h) }}
          />
        </div>
        {/* Unclipped layer: outline, guides and the handles that hang over the edge. */}
        <div
          className="absolute outline outline-2 outline-white"
          style={{ left: pct(crop.x), top: pct(crop.y), width: pct(crop.w), height: pct(crop.h) }}
        >
          {/* Rule-of-thirds guide for lining up the card edges */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/70" />
            ))}
          </div>
          <button
            type="button"
            aria-label="Move crop area. Use arrow keys to nudge; hold Shift for larger steps."
            className="absolute inset-0 cursor-move rounded-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            onPointerDown={onPointerDown('move')}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={onKeyDown('move')}
          />
          {(Object.keys(CORNER_SIGNS) as Corner[]).map((corner) => {
            const [sx, sy] = CORNER_SIGNS[corner]
            return (
              <button
                key={corner}
                type="button"
                aria-label={`Resize from ${CORNER_LABELS[corner]} corner. Arrow keys grow or shrink.`}
                className={[
                  'absolute h-7 w-7 rounded-full border-2 border-white bg-primary shadow-md transition-transform duration-quick hover:scale-110',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  sx < 0 ? '-left-3.5' : '-right-3.5',
                  sy < 0 ? '-top-3.5' : '-bottom-3.5',
                  (sx < 0) === (sy < 0) ? 'cursor-nwse-resize' : 'cursor-nesw-resize',
                ].join(' ')}
                onPointerDown={onPointerDown(corner)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onLostPointerCapture={endDrag}
                onKeyDown={onKeyDown(corner)}
              />
            )
          })}
        </div>
        <p aria-live="polite" className="sr-only">
          {`Crop at ${Math.round(crop.x * 100)}%, ${Math.round(crop.y * 100)}%, width ${Math.round(crop.w * 100)}% of the image.`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => rotate(-90)}>
          <ArrowCounterClockwise className="h-4 w-4" />
          Rotate left
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => rotate(90)}>
          <ArrowClockwise className="h-4 w-4" />
          Rotate right
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => onChange({ rotation, crop: defaultCrop(rw, rh) })}
        >
          <ArrowsOutSimple className="h-4 w-4" />
          Reset crop
        </Button>
      </div>
    </div>
  )
}

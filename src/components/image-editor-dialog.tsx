import * as React from 'react'
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowsHorizontal,
  ArrowsVertical,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  centredCrop,
  editedSize,
  renderEdited,
  rotatedSize,
  type CropRect,
  type DecodedImage,
  type Edits,
  type Rotation,
} from '@/lib/image-pipeline'
import { cn } from '@/lib/utils'

const FULL: CropRect = { x: 0, y: 0, w: 1, h: 1 }
const MIN = 0.04

export const CROP_RATIOS: { id: string; label: string; ratio: number | 'original' | null }[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: 'original', label: 'Original', ratio: 'original' },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: 'passport', label: 'Passport 35×45', ratio: 35 / 45 },
]

type Corner = 'tl' | 'tr' | 'bl' | 'br'
const CORNERS: Corner[] = ['tl', 'tr', 'bl', 'br']
const CORNER_LABEL: Record<Corner, string> = { tl: 'top-left', tr: 'top-right', bl: 'bottom-left', br: 'bottom-right' }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface Drag {
  mode: 'move' | Corner
  sx: number
  sy: number
  start: CropRect
}

export function ImageEditorDialog({
  open,
  onOpenChange,
  image,
  initial,
  onApply,
  name,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  image: DecodedImage | null
  initial: Edits
  onApply: (edits: Edits) => void
  name?: string
}) {
  const [rotation, setRotation] = React.useState<Rotation>(initial.rotation)
  const [flipH, setFlipH] = React.useState(initial.flipH)
  const [flipV, setFlipV] = React.useState(initial.flipV)
  const [crop, setCrop] = React.useState<CropRect>(initial.crop ?? FULL)
  const [ratioId, setRatioId] = React.useState('free')
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null)
  // A callback ref: the dialog's content mounts a render after `open` flips (it portals in),
  // so the observer must attach when the element appears, not when `open` changes.
  const [wrapEl, setWrapEl] = React.useState<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const drag = React.useRef<Drag | null>(null)

  // Reset to the item's current edits each time the dialog opens.
  React.useEffect(() => {
    if (!open) return
    setRotation(initial.rotation)
    setFlipH(initial.flipH)
    setFlipV(initial.flipV)
    setCrop(initial.crop ?? FULL)
    setRatioId('free')
  }, [open, initial])

  const [rw, rh] = image ? rotatedSize(image.width, image.height, rotation) : [1, 1]

  React.useEffect(() => {
    if (!wrapEl) return
    // Measure straight away (client sizes ignore the dialog's zoom-in transform),
    // then keep following size changes such as a rotation.
    if (wrapEl.clientWidth > 0) setBox({ w: wrapEl.clientWidth, h: wrapEl.clientHeight })
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r && r.width > 0) setBox({ w: r.width, h: r.height })
    })
    ro.observe(wrapEl)
    return () => ro.disconnect()
  }, [wrapEl])

  // The background shows the whole rotated/flipped image; the crop is an overlay.
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !box || !image) return
    const dpr = window.devicePixelRatio || 1
    const rendered = renderEdited(image, { rotation, flipH, flipV, crop: null }, box.w * dpr, box.h * dpr)
    canvas.width = rendered.width
    canvas.height = rendered.height
    canvas.getContext('2d')?.drawImage(rendered, 0, 0)
  }, [box, image, rotation, flipH, flipV])

  /** Locked aspect in normalised units (w / h), or null for free. */
  const lockedAspect = (): number | null => {
    const r = CROP_RATIOS.find((x) => x.id === ratioId)?.ratio
    if (r == null) return null
    const pixelRatio = r === 'original' ? (image ? image.width / image.height : 1) : r
    return (pixelRatio * rh) / rw
  }

  const pickRatio = (id: string) => {
    setRatioId(id)
    const r = CROP_RATIOS.find((x) => x.id === id)?.ratio
    if (!image) return
    if (r == null) return
    const pixelRatio = r === 'original' ? image.width / image.height : r
    setCrop(centredCrop(image.width, image.height, rotation, pixelRatio))
  }

  const rotate = (delta: 90 | -90) => {
    const next = ((((rotation + delta) % 360) + 360) % 360) as Rotation
    setRotation(next)
    // The old rectangle doesn't survive a quarter turn; restart from the full frame
    // (or the chosen ratio, centred).
    const r = CROP_RATIOS.find((x) => x.id === ratioId)?.ratio
    if (image && r != null) {
      setCrop(centredCrop(image.width, image.height, next, r === 'original' ? image.width / image.height : r))
    } else {
      setCrop(FULL)
    }
  }

  const flip = (axis: 'h' | 'v') => {
    if (axis === 'h') {
      setFlipH((f) => !f)
      setCrop((c) => ({ ...c, x: 1 - c.x - c.w }))
    } else {
      setFlipV((f) => !f)
      setCrop((c) => ({ ...c, y: 1 - c.y - c.h }))
    }
  }

  const resizeFromCorner = (start: CropRect, corner: Corner, dx: number, dy: number): CropRect => {
    const right = start.x + start.w
    const bottom = start.y + start.h
    const left = corner === 'tl' || corner === 'bl'
    const top = corner === 'tl' || corner === 'tr'
    let w = clamp(left ? start.w - dx : start.w + dx, MIN, left ? right : 1 - start.x)
    let h = clamp(top ? start.h - dy : start.h + dy, MIN, top ? bottom : 1 - start.y)
    const aspect = lockedAspect()
    if (aspect) {
      // Follow the larger movement, then shrink to stay inside the image.
      if (Math.abs(dx) >= Math.abs(dy)) h = w / aspect
      else w = h * aspect
      const maxW = left ? right : 1 - start.x
      const maxH = top ? bottom : 1 - start.y
      const s = Math.min(1, maxW / w, maxH / h)
      w *= s
      h *= s
    }
    return { x: left ? right - w : start.x, y: top ? bottom - h : start.y, w, h }
  }

  const onPointerDown = (mode: Drag['mode']) => (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { mode, sx: e.clientX, sy: e.clientY, start: crop }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || !box) return
    const dx = (e.clientX - d.sx) / box.w
    const dy = (e.clientY - d.sy) / box.h
    if (d.mode === 'move') {
      setCrop({ ...d.start, x: clamp(d.start.x + dx, 0, 1 - d.start.w), y: clamp(d.start.y + dy, 0, 1 - d.start.h) })
    } else {
      setCrop(resizeFromCorner(d.start, d.mode, dx, dy))
    }
  }
  const endDrag = () => {
    drag.current = null
  }

  const onKey = (mode: Drag['mode']) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const d = delta[e.key]
    if (!d) return
    e.preventDefault()
    if (mode === 'move') {
      setCrop((c) => ({ ...c, x: clamp(c.x + d[0], 0, 1 - c.w), y: clamp(c.y + d[1], 0, 1 - c.h) }))
    } else {
      setCrop((c) => resizeFromCorner(c, mode, d[0], d[1]))
    }
  }

  const isFull = crop.x <= 0.0005 && crop.y <= 0.0005 && crop.w >= 0.9995 && crop.h >= 0.9995
  const result: Edits = { rotation, flipH, flipV, crop: isFull ? null : crop }
  const [outW, outH] = image ? editedSize(image.width, image.height, result) : [0, 0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit image</DialogTitle>
          <DialogDescription className="truncate">
            {name ? `${name}: ` : ''}crop, rotate or flip. Drag the box or its corners; arrow keys work too (hold Shift for bigger steps).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => rotate(-90)} title="Rotate left 90°">
            <ArrowCounterClockwise className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => rotate(90)} title="Rotate right 90°">
            <ArrowClockwise className="h-4 w-4" />
          </Button>
          <Button variant={flipH ? 'secondary' : 'outline'} size="sm" onClick={() => flip('h')} title="Flip horizontally" aria-pressed={flipH}>
            <ArrowsHorizontal className="h-4 w-4" />
          </Button>
          <Button variant={flipV ? 'secondary' : 'outline'} size="sm" onClick={() => flip('v')} title="Flip vertically" aria-pressed={flipV}>
            <ArrowsVertical className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="sr-only">Crop ratio</legend>
            {CROP_RATIOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pickRatio(r.id)}
                aria-pressed={ratioId === r.id}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs transition-colors duration-quick',
                  ratioId === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60'
                )}
              >
                {r.label}
              </button>
            ))}
          </fieldset>
        </div>

        <div className="flex justify-center rounded-md bg-muted/40 p-2">
          <div
            ref={setWrapEl}
            className="relative overflow-hidden"
            style={{ aspectRatio: `${rw} / ${rh}`, width: `min(100%, calc(58vh * ${rw / rh}))`, touchAction: 'none' }}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
            <div
              className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }}
            >
              {/* Rule-of-thirds guides */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden>
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="border border-white/25" />
                ))}
              </div>
              <button
                type="button"
                aria-label="Move crop area"
                className="absolute inset-0 cursor-move outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onPointerDown={onPointerDown('move')}
                onKeyDown={onKey('move')}
              />
              {CORNERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Resize from the ${CORNER_LABEL[c]} corner`}
                  onPointerDown={onPointerDown(c)}
                  onKeyDown={onKey(c)}
                  className={cn(
                    'absolute size-5 rounded-full border-2 border-white bg-primary outline-none focus-visible:ring-2 focus-visible:ring-white',
                    c === 'tl' && '-left-2.5 -top-2.5 cursor-nwse-resize',
                    c === 'tr' && '-right-2.5 -top-2.5 cursor-nesw-resize',
                    c === 'bl' && '-bottom-2.5 -left-2.5 cursor-nesw-resize',
                    c === 'br' && '-bottom-2.5 -right-2.5 cursor-nwse-resize'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row flex-wrap items-center gap-2 sm:justify-between">
          <p className="text-sm text-muted-foreground tabular-nums">
            Result: {outW} × {outH} px
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRotation(0)
                setFlipH(false)
                setFlipV(false)
                setCrop(FULL)
                setRatioId('free')
              }}
            >
              Reset
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onApply(result)
                onOpenChange(false)
              }}
            >
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

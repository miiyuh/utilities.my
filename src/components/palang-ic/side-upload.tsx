import { UploadSimple, Crop, Trash, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { humanSize } from '@/lib/image-utils'
import type { CardSide } from '@/lib/palang-ic'
import { Hint } from '@/components/ui/tooltip'
import { useFileIntake } from '@/hooks/use-file-intake'
import { toolAccepts } from '@/lib/tools'

const ACCEPTS = toolAccepts('/palang-ic')

interface SideUploadProps {
  label: 'Front' | 'Back'
  hint: string
  side: CardSide | null
  busy?: boolean
  onFile: (file: File) => void
  /** Why a chosen or dropped file was turned away. */
  onProblem: (message: string) => void
  onRemove: () => void
  onEdit: () => void
}

/**
 * One drop zone for a card side. Each instance has its own file input, so two
 * can live on the same page. Pasting is handled by the page, which knows which
 * side is still empty.
 */
export function SideUpload({ label, hint, side, busy = false, onFile, onProblem, onRemove, onEdit }: SideUploadProps) {
  const { dragging, dropTarget, open, inputProps } = useFileIntake({
    accepts: ACCEPTS,
    onFiles: (files, problems) => {
      if (files[0]) onFile(files[0])
      else if (problems[0]) onProblem(problems[0])
    },
  })

  const rotationClass =
    side?.rotation === 90 ? 'rotate-90' : side?.rotation === 180 ? 'rotate-180' : side?.rotation === 270 ? '-rotate-90' : ''

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <div
        ref={dropTarget}
        className={`relative rounded-lg border-2 border-dashed transition-all duration-quick ${
          dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/25'
        } ${!side ? 'hover:border-primary/50 hover:bg-accent/50' : ''}`}
      >
        {!side ? (
          <button
            type="button"
            aria-label={`Drop the ${label.toLowerCase()} of the card here or click to choose a photo`}
            className="flex min-h-[132px] w-full flex-col items-center justify-center gap-2 p-4 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
            onClick={open}
            disabled={busy}
          >
            <UploadSimple className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-foreground">{busy ? 'Reading photo…' : 'Drop a photo or click to choose'}</span>
            <span className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 50 MB</span>
          </button>
        ) : (
          <div className="space-y-2 p-3">
            <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md bg-muted">
              <img
                src={side.objectUrl}
                alt={`${label} of the card`}
                className={`max-h-full max-w-full object-contain transition-transform duration-medium ${rotationClass}`}
              />
            </div>
            <div className="min-w-0">
              <Hint label={side.file.name}>
                <p className="truncate text-sm font-medium text-foreground">
                {side.file.name}
              </p>
              </Hint>
              <p className="text-xs text-muted-foreground">
                {humanSize(side.file.size)} · {side.width}×{side.height}px
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button type="button" size="xs" variant="outline" onClick={onEdit}>
                  <Crop className="h-3.5 w-3.5" />
                  Crop &amp; rotate
                </Button>
                <Button type="button" size="xs" variant="ghost" onClick={open} disabled={busy}>
                  <ArrowsClockwise className="h-3.5 w-3.5" />
                  Change
                </Button>
                <Button type="button" size="xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
                  <Trash className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
        <input {...inputProps} className="sr-only" tabIndex={-1} aria-hidden="true" />
      </div>
    </div>
  )
}

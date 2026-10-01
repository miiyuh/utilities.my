import * as React from 'react'
import {
  Image as ImageIcon,
  Upload,
  Download,
  PencilSimple,
  ArrowRight,
  Spinner,
  CheckCircle,
  Warning,
  MapPin,
  Info,
  X,
  Stack,
  Archive,
  Play,
  ClipboardText,
} from 'phosphor-react'
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar'
import { SidebarContent } from '@/components/sidebar-content'
import { PageHeader } from '@/components/page-header'
import { ToolMethodology } from '@/components/tool-methodology'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ClearButton } from '@/components/ui/clear-button'
import { Hint } from '@/components/ui/tooltip'
import { ImageEditorDialog } from '@/components/image-editor-dialog'
import { CompareSlider } from '@/components/compare-slider'
import { useToast } from '@/hooks/use-toast'
import { downloadBlob, humanSize, isIOSOrSafari } from '@/lib/image-utils'
import {
  FORMATS,
  MAX_DIMENSION,
  MAX_FILE_BYTES,
  NO_EDITS,
  centredCrop,
  decodeImage,
  editedSize,
  encodeCanvas,
  encodeToTarget,
  fitLongEdge,
  hasEdits,
  isAcceptedImage,
  isHeic,
  outputFilename,
  renderEdited,
  type DecodedImage,
  type Edits,
  type OutputFormat,
} from '@/lib/image-pipeline'
import { canKeepMetadata, carryOverMetadata, metadataOverhead, readMetadata, type MetadataMode, type MetadataReport } from '@/lib/image-metadata'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Shared settings
// ---------------------------------------------------------------------------

interface OutputSettings {
  format: OutputFormat
  quality: number
  useTarget: boolean
  targetKb: string
  metaMode: MetadataMode
}

interface Preset {
  id: string
  label: string
  hint: string
  format?: OutputFormat
  quality?: number
  targetKb?: number
  longEdge?: number
  /** Exact output size; implies a centred crop to its aspect ratio. */
  exact?: [number, number]
}

const PRESETS: Preset[] = [
  { id: 'custom', label: 'Custom', hint: 'Set everything yourself.' },
  { id: 'whatsapp', label: 'WhatsApp / chat', hint: 'Long edge 1600 px, JPEG. Sharp in chats without the extra weight.', format: 'image/jpeg', quality: 0.82, longEdge: 1600 },
  { id: 'insta-square', label: 'Instagram square', hint: '1080 × 1080 px, cropped to 1:1.', format: 'image/jpeg', quality: 0.9, exact: [1080, 1080] },
  { id: 'insta-portrait', label: 'Instagram portrait', hint: '1080 × 1350 px, cropped to 4:5.', format: 'image/jpeg', quality: 0.9, exact: [1080, 1350] },
  { id: 'email', label: 'Email-friendly', hint: 'Long edge 1280 px, kept under 300 KB.', format: 'image/jpeg', targetKb: 300, longEdge: 1280 },
  { id: 'web', label: 'Website image', hint: 'Long edge 1920 px, WebP. Fast to load.', format: 'image/webp', quality: 0.8, longEdge: 1920 },
  { id: 'passport', label: 'Passport photo 35 × 45 mm', hint: '413 × 531 px (300 dpi), cropped to 35:45. Fine-tune the crop with Edit.', format: 'image/jpeg', quality: 0.95, exact: [413, 531] },
]

const META_OPTIONS: { value: MetadataMode; label: string }[] = [
  { value: 'strip', label: 'Remove all metadata (recommended)' },
  { value: 'keep-no-location', label: 'Keep it, but remove location' },
  { value: 'keep-all', label: 'Keep everything' },
]

const PASTE_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

function validate(file: File): string | null {
  if (isHeic(file)) return `${file.name} is a HEIC photo, which isn't supported. Save it as JPEG on your iPhone (Settings → Camera → Formats → Most Compatible) or export it as JPEG first.`
  if (!isAcceptedImage(file)) return `${file.name} isn't an image.`
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 50 MB.`
  return null
}

function SizeChange({ from, to, className }: { from: number; to: number; className?: string }) {
  const smaller = to <= from
  const pct = from > 0 ? Math.round(Math.abs(1 - to / from) * 100) : 0
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 tabular-nums', className)}>
      <span>{humanSize(from)}</span>
      <ArrowRight className="h-3.5 w-3.5 self-center text-muted-foreground" />
      <span className="font-semibold text-foreground">{humanSize(to)}</span>
      <span className={cn('text-xs font-medium', smaller ? 'text-success' : 'text-warning')}>
        {pct === 0 ? 'same size' : `${pct}% ${smaller ? 'smaller' : 'larger'}`}
      </span>
    </span>
  )
}

/** Format, quality / target size and metadata controls, shared by both modes. */
function OutputControls({
  settings,
  onChange,
  metadataNote,
}: {
  settings: OutputSettings
  onChange: (patch: Partial<OutputSettings>) => void
  metadataNote: React.ReactNode
}) {
  const lossy = FORMATS[settings.format].lossy
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="out-format">Format</Label>
        <Select value={settings.format} onValueChange={(v) => onChange({ format: v as OutputFormat })}>
          <SelectTrigger id="out-format" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FORMATS) as OutputFormat[]).map((f) => (
              <SelectItem key={f} value={f}>
                {FORMATS[f].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{FORMATS[settings.format].note}</p>
      </div>

      {lossy && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="use-target" className="cursor-pointer">Aim for a file size</Label>
            <Switch id="use-target" checked={settings.useTarget} onCheckedChange={(c) => onChange({ useTarget: c })} />
          </div>
          {settings.useTarget ? (
            <div className="flex items-center gap-2">
              <Input
                id="target-kb"
                inputMode="numeric"
                value={settings.targetKb}
                onChange={(e) => onChange({ targetKb: e.target.value.replace(/[^\d]/g, '') })}
                className="w-28"
                aria-label="Target size in kilobytes"
              />
              <span className="text-sm text-muted-foreground">KB or less. Quality is tuned automatically.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quality</span>
                <span className="font-mono tabular-nums">{Math.round(settings.quality * 100)}%</span>
              </div>
              <Slider
                value={[Math.round(settings.quality * 100)]}
                min={10}
                max={100}
                step={1}
                onValueChange={(v) => onChange({ quality: v[0] / 100 })}
                aria-label="Quality"
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="meta-mode">Metadata in the output</Label>
        <Select value={settings.metaMode} onValueChange={(v) => onChange({ metaMode: v as MetadataMode })}>
          <SelectTrigger id="meta-mode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {META_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">{metadataNote}</div>
      </div>
    </div>
  )
}

function MetadataPanel({ report, loading }: { report: MetadataReport | null; loading: boolean }) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4 animate-spin" /> Reading the file…
      </p>
    )
  }
  if (!report) {
    return <p className="text-sm text-muted-foreground">No metadata found. This file doesn&apos;t carry camera, date or location details.</p>
  }
  return (
    <div className="space-y-4">
      {report.hasLocation && (
        <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            <strong>This photo records where it was taken.</strong> Anyone you send the original to can see the location. It&apos;s removed from
            the converted file unless you choose to keep it.
          </p>
        </div>
      )}
      <div className="grid gap-4">
        {report.groups.map((g) => (
          <section key={g.title} className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</h4>
            <dl className="space-y-1 text-sm">
              {g.items.map((it) => (
                <div key={it.label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{it.label}</dt>
                  <dd className="min-w-0 text-right font-medium break-words">{it.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="raw">
          <AccordionTrigger className="px-3 text-sm">All {report.raw.length} tags in this file</AccordionTrigger>
          <AccordionContent className="px-3">
            <dl className="max-h-72 space-y-1 overflow-y-auto font-mono text-xs">
              {report.raw.map((it) => (
                <div key={it.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
                  <dt className="truncate text-muted-foreground">{it.label}</dt>
                  <dd className="break-words">{it.value}</dd>
                </div>
              ))}
            </dl>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

/** An object URL for a blob, created and revoked with the effect (safe under StrictMode remounts). */
function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

function DropZone({ multiple, onFiles, compact }: { multiple: boolean; onFiles: (files: File[]) => void; compact?: boolean }) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const zoneRef = React.useRef<HTMLButtonElement>(null)
  const [over, setOver] = React.useState(false)
  const onFilesRef = React.useRef(onFiles)
  React.useEffect(() => {
    onFilesRef.current = onFiles
  })
  // Drag-and-drop is a pointer convenience (the button is the accessible path),
  // so the listeners are attached directly rather than as JSX handlers.
  React.useEffect(() => {
    const el = zoneRef.current
    if (!el) return
    const over = (e: DragEvent) => {
      e.preventDefault()
      setOver(true)
    }
    const leave = () => setOver(false)
    const drop = (e: DragEvent) => {
      e.preventDefault()
      setOver(false)
      onFilesRef.current(Array.from(e.dataTransfer?.files ?? []))
    }
    el.addEventListener('dragover', over)
    el.addEventListener('dragleave', leave)
    el.addEventListener('drop', drop)
    return () => {
      el.removeEventListener('dragover', over)
      el.removeEventListener('dragleave', leave)
      el.removeEventListener('drop', drop)
    }
  }, [])
  return (
    <>
    {/* The whole box is the button: click, tap or press Enter anywhere inside it. */}
    <button
      ref={zoneRef}
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed text-center transition-colors duration-quick outline-none hover:border-primary/60 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/30',
        compact ? 'p-4' : 'p-8 sm:p-10',
        over ? 'border-primary bg-primary/5' : 'border-border'
      )}
    >
      {!compact && <Upload className="h-8 w-8 text-muted-foreground" />}
      <div className="space-y-1">
        <p className="text-sm font-medium">{multiple ? 'Drop images here' : 'Drop an image here'}</p>
        <p className="text-xs text-muted-foreground">
          or paste with {PASTE_KEY} V. PNG, JPEG, WebP, GIF and AVIF, up to 50 MB.
        </p>
      </div>
      <span className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium">
        <Upload className="h-4 w-4" /> {multiple ? 'Choose images' : 'Choose an image'}
      </span>
    </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
    </>
  )
}

/** Images on the clipboard (Ctrl/⌘ V anywhere on the page). */
function usePasteImages(onFiles: (files: File[]) => void) {
  const cb = React.useRef(onFiles)
  React.useEffect(() => {
    cb.current = onFiles
  })
  React.useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (files.length) {
        e.preventDefault()
        cb.current(files)
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])
}

// ---------------------------------------------------------------------------
// Single image
// ---------------------------------------------------------------------------

interface PreviewResult {
  blob: Blob
  before: Blob
  quality: number
  fits: boolean
  /** The inputs it was made from; see `inputsKey`. */
  key: string
}

/**
 * Encodes with the chosen settings, then copies metadata across. With a size
 * target, the metadata's bytes come out of the budget and `fits` is checked
 * against the final file, so the size promised is the size downloaded.
 */
async function encodeOutput(
  canvas: HTMLCanvasElement,
  source: File,
  settings: OutputSettings,
  size: { width: number; height: number }
): Promise<{ blob: Blob; quality: number; fits: boolean }> {
  const target = Number(settings.targetKb) * 1024
  if (FORMATS[settings.format].lossy && settings.useTarget && target > 0) {
    const overhead = await metadataOverhead(source, settings.format, settings.metaMode)
    const encoded = await encodeToTarget(canvas, settings.format, Math.max(1, target - overhead))
    const blob = await carryOverMetadata(source, encoded.blob, settings.metaMode, size)
    return { blob, quality: encoded.quality, fits: blob.size <= target }
  }
  const encoded = await encodeCanvas(canvas, settings.format, settings.quality)
  return { blob: await carryOverMetadata(source, encoded, settings.metaMode, size), quality: settings.quality, fits: true }
}

function SingleConverter({
  settings,
  setSettings,
}: {
  settings: OutputSettings
  setSettings: React.Dispatch<React.SetStateAction<OutputSettings>>
}) {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [image, setImage] = React.useState<DecodedImage | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [edits, setEdits] = React.useState<Edits>(NO_EDITS)
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [width, setWidth] = React.useState(0)
  const [height, setHeight] = React.useState(0)
  const [lockAspect, setLockAspect] = React.useState(true)
  const [presetId, setPresetId] = React.useState('custom')
  const [meta, setMeta] = React.useState<MetadataReport | null>(null)
  const [metaLoading, setMetaLoading] = React.useState(false)
  const [preview, setPreview] = React.useState<PreviewResult | null>(null)
  const [encoding, setEncoding] = React.useState(false)
  const [encodeError, setEncodeError] = React.useState<string | null>(null)
  const generation = React.useRef(0)
  /** Latest load request; results from an earlier, slower load are ignored. */
  const loadId = React.useRef(0)
  const replaceRef = React.useRef<HTMLInputElement>(null)

  const thumbUrl = useObjectUrl(file)
  const afterUrl = useObjectUrl(preview?.blob ?? null)
  const beforeUrl = useObjectUrl(preview?.before ?? null)

  const [ew, eh] = image ? editedSize(image.width, image.height, edits) : [0, 0]

  const load = async (f: File) => {
    const problem = validate(f)
    if (problem) {
      setError(problem)
      return
    }
    const id = ++loadId.current
    const current = () => id === loadId.current
    setError(null)
    setLoading(true)
    setMeta(null)
    setMetaLoading(true)
    setPreview(null)
    setEdits(NO_EDITS)
    setPresetId('custom')
    void readMetadata(f).then((r) => {
      if (!current()) return
      setMeta(r)
      setMetaLoading(false)
    })
    try {
      const img = await decodeImage(f)
      if (!current()) return
      setFile(f)
      setImage(img)
      setWidth(img.width)
      setHeight(img.height)
    } catch (e) {
      if (!current()) return
      setImage(null)
      setFile(null)
      setError(e instanceof Error ? e.message : 'This image could not be opened.')
    } finally {
      if (current()) setLoading(false)
    }
  }

  usePasteImages((files) => void load(files[0]))

  const clear = () => {
    loadId.current++
    setFile(null)
    setImage(null)
    setMeta(null)
    setPreview(null)
    setEdits(NO_EDITS)
    setError(null)
    setPresetId('custom')
  }

  const setOutputSize = (w: number, h: number) => {
    setWidth(Math.max(1, Math.min(MAX_DIMENSION, Math.round(w))))
    setHeight(Math.max(1, Math.min(MAX_DIMENSION, Math.round(h))))
  }

  const applyEdits = (next: Edits) => {
    setEdits(next)
    if (!image) return
    const [nw, nh] = editedSize(image.width, image.height, next)
    const preset = PRESETS.find((p) => p.id === presetId)
    if (preset?.longEdge) setOutputSize(...fitLongEdge(nw, nh, preset.longEdge))
    else if (preset?.exact) setOutputSize(...preset.exact)
    else setOutputSize(nw, nh)
  }

  const applyPreset = (id: string) => {
    setPresetId(id)
    const p = PRESETS.find((x) => x.id === id)
    if (!p || !image) return
    setSettings((s) => ({
      ...s,
      format: p.format ?? s.format,
      quality: p.quality ?? s.quality,
      useTarget: p.targetKb != null,
      targetKb: p.targetKb != null ? String(p.targetKb) : s.targetKb,
    }))
    if (p.exact) {
      const crop = centredCrop(image.width, image.height, edits.rotation, p.exact[0] / p.exact[1])
      setEdits((e) => ({ ...e, crop }))
      setOutputSize(...p.exact)
    } else if (p.longEdge) {
      setOutputSize(...fitLongEdge(ew, eh, p.longEdge))
    } else {
      setOutputSize(ew, eh)
    }
  }

  const onWidth = (v: string) => {
    const w = Math.min(MAX_DIMENSION, Number(v.replace(/[^\d]/g, '')) || 0)
    setPresetId('custom')
    setWidth(w)
    if (lockAspect && ew) setHeight(Math.max(1, Math.round((w * eh) / ew)))
  }
  const onHeight = (v: string) => {
    const h = Math.min(MAX_DIMENSION, Number(v.replace(/[^\d]/g, '')) || 0)
    setPresetId('custom')
    setHeight(h)
    if (lockAspect && eh) setWidth(Math.max(1, Math.round((h * ew) / eh)))
  }

  // Everything the output depends on. A preview made from other inputs is
  // stale, even during the debounce, so Download never hands over a file made
  // with the previous settings.
  const inputsKey = file ? JSON.stringify([file.name, file.size, file.lastModified, edits, width, height, settings]) : ''
  const previewCurrent = preview != null && preview.key === inputsKey

  // Live preview, encoded with exactly the settings the download uses, so the
  // size shown is the size you get.
  React.useEffect(() => {
    if (!image || !file || width < 1 || height < 1) return
    const id = ++generation.current
    const timer = window.setTimeout(
      () => {
        void (async () => {
          setEncoding(true)
          setEncodeError(null)
          try {
            const canvas = renderEdited(image, edits, width, height, settings.format === 'image/jpeg')
            const encoded = await encodeOutput(canvas, file, settings, { width, height })
            // Same crop, rotation and size as the output, losslessly, so the slider
            // compares compression alone, pixel for pixel.
            const [bw, bh] = fitLongEdge(width, height, 1400)
            const before = await encodeCanvas(renderEdited(image, edits, bw, bh), 'image/png', 1)
            if (id !== generation.current) return
            setPreview({ blob: encoded.blob, before, quality: encoded.quality, fits: encoded.fits, key: inputsKey })
          } catch (e) {
            if (id === generation.current) setEncodeError(e instanceof Error ? e.message : 'Encoding failed.')
          } finally {
            if (id === generation.current) setEncoding(false)
          }
        })()
      },
      settings.format === 'image/avif' ? 700 : 300
    )
    return () => window.clearTimeout(timer)
  }, [image, file, edits, width, height, settings, inputsKey])

  const download = () => {
    if (!preview || !file || !previewCurrent) return
    const name = outputFilename(file.name, settings.format)
    downloadBlob(preview.blob, name, isIOSOrSafari())
    toast({ title: 'Image saved', description: `${name} (${humanSize(preview.blob.size)})` })
  }

  const keepPossible = file ? canKeepMetadata(file, settings.format) : false
  const metadataNote =
    settings.metaMode === 'strip'
      ? 'Camera details, dates and location are removed from the converted file.'
      : keepPossible
        ? settings.metaMode === 'keep-all'
          ? 'Everything is copied across: camera details, dates, captions, credits and location if the photo has it.'
          : 'Camera details and dates are copied across. Location is removed, and so are captions, credits and maker notes, which can also hold it.'
        : 'Metadata can only be carried over from a JPEG to a JPEG. Choose JPEG output to keep it; otherwise it is removed.'

  if (!file || !image) {
    return (
      <Card className="minimal-card">
        <CardContent className="space-y-4 pt-6">
          <DropZone multiple={false} onFiles={(fs) => fs[0] && void load(fs[0])} />
          {loading && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4 animate-spin" /> Opening the image…
            </p>
          )}
          {error && (
            <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <Warning className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const lossy = FORMATS[settings.format].lossy

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      <div className="space-y-6">
        <Card className="minimal-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline text-lg">Your image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {thumbUrl && <img src={thumbUrl} alt="" className="h-16 w-16 shrink-0 rounded-md border border-border bg-muted object-cover" />}
              <div className="min-w-0 flex-1 text-sm">
                <Hint label={file.name}>
                  <p className="truncate font-medium">{file.name}</p>
                </Hint>
                <p className="text-muted-foreground tabular-nums">
                  {humanSize(file.size)} · {image.width} × {image.height} px · {file.type.replace('image/', '').toUpperCase()}
                </p>
                {hasEdits(edits) && (
                  <p className="text-xs text-primary tabular-nums">
                    Edited: {ew} × {eh} px
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
                <PencilSimple className="h-4 w-4" /> Crop, rotate, flip
              </Button>
              <Button variant="outline" size="sm" onClick={() => replaceRef.current?.click()}>
                <Upload className="h-4 w-4" /> Choose another image
              </Button>
              <input
                ref={replaceRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void load(f)
                  e.target.value = ''
                }}
              />
              <ClearButton
                onClear={clear}
                hasContent
                label="Remove"
                confirmLabel="Remove image"
                className="ml-auto"
                confirmTitle="Remove this image?"
                confirmDescription="The image and your settings for it will be cleared."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="minimal-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline text-lg">What&apos;s in this file</CardTitle>
          </CardHeader>
          <CardContent>
            <MetadataPanel report={meta} loading={metaLoading} />
          </CardContent>
        </Card>

        <Card className="minimal-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline text-lg">Output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="preset">Preset</Label>
              <Select value={presetId} onValueChange={applyPreset}>
                <SelectTrigger id="preset" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{PRESETS.find((p) => p.id === presetId)?.hint}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="out-w">Width (px)</Label>
                  <Input id="out-w" inputMode="numeric" value={width || ''} onChange={(e) => onWidth(e.target.value)} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="out-h">Height (px)</Label>
                  <Input id="out-h" inputMode="numeric" value={height || ''} onChange={(e) => onHeight(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Switch id="lock-aspect" checked={lockAspect} onCheckedChange={setLockAspect} />
                  <Label htmlFor="lock-aspect" className="cursor-pointer font-normal">Keep aspect ratio</Label>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {ew ? Math.round((width / ew) * 100) : 100}% of {hasEdits(edits) ? 'edited' : 'original'} size
                </span>
              </div>
            </div>

            <OutputControls settings={settings} onChange={(p) => setSettings((s) => ({ ...s, ...p }))} metadataNote={metadataNote} />
          </CardContent>
        </Card>
      </div>

      <Card className="minimal-card lg:sticky lg:top-20">
        <CardHeader className="pb-3">
          <CardTitle className="font-headline text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {beforeUrl && afterUrl ? (
            <CompareSlider before={beforeUrl} after={afterUrl} beforeLabel="Uncompressed" className="aspect-[4/3] w-full" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              <Spinner className="mr-2 h-4 w-4 animate-spin" /> Preparing preview…
            </div>
          )}
          <div className="rounded-md bg-muted/40 p-3 text-sm sm:p-4">
            <div className="mb-1.5 text-xs text-muted-foreground">File size</div>
            {preview && !encoding ? (
              <SizeChange from={file.size} to={preview.blob.size} className="text-base" />
            ) : (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-4 w-4 animate-spin" />
                {settings.format === 'image/avif' ? 'Encoding AVIF (this takes a moment)…' : 'Calculating…'}
              </span>
            )}
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
              <span>
                Format: <span className="text-foreground">{FORMATS[settings.format].label}</span>
              </span>
              <span>
                Size: <span className="text-foreground tabular-nums">{width} × {height}</span>
              </span>
              {lossy && preview && (
                <span>
                  Quality: <span className="text-foreground tabular-nums">{Math.round(preview.quality * 100)}%</span>
                </span>
              )}
              <span>
                Metadata:{' '}
                <span className="text-foreground">
                  {settings.metaMode === 'strip' || !keepPossible ? 'removed' : settings.metaMode === 'keep-all' ? 'kept' : 'kept, no location'}
                </span>
              </span>
            </div>
            {preview && !preview.fits && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Even at the lowest quality this is above {settings.targetKb} KB. Try smaller dimensions.
              </p>
            )}
            {encodeError && <p className="mt-2 text-xs text-destructive">{encodeError}</p>}
          </div>
          <Button onClick={download} disabled={!previewCurrent || encoding} className="h-11 w-full text-base">
            <Download className="h-5 w-5" /> Download {FORMATS[settings.format].label}
          </Button>
        </CardContent>
      </Card>

      <ImageEditorDialog open={editorOpen} onOpenChange={setEditorOpen} image={image} initial={edits} onApply={applyEdits} name={file.name} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Batch
// ---------------------------------------------------------------------------

interface BatchItem {
  id: string
  file: File
  edits: Edits
  status: 'queued' | 'working' | 'done' | 'error'
  error?: string
  output?: Blob
  /** The format `output` was encoded in. */
  format?: OutputFormat
  /** The settings and edits `output` was made with. */
  key?: string
  hasLocation?: boolean
}

const LONG_EDGES = [
  { value: '0', label: 'Keep original size' },
  { value: '3840', label: 'Up to 3840 px (4K)' },
  { value: '2560', label: 'Up to 2560 px' },
  { value: '1920', label: 'Up to 1920 px (Full HD)' },
  { value: '1600', label: 'Up to 1600 px' },
  { value: '1280', label: 'Up to 1280 px' },
  { value: '800', label: 'Up to 800 px' },
]

const MAX_BATCH = 30

function BatchThumb({ file }: { file: File }) {
  const url = useObjectUrl(file)
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
      {url && <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />}
    </div>
  )
}

function BatchConverter({
  settings,
  setSettings,
}: {
  settings: OutputSettings
  setSettings: React.Dispatch<React.SetStateAction<OutputSettings>>
}) {
  const { toast } = useToast()
  const [storedItems, setItems] = React.useState<BatchItem[]>([])
  const [longEdge, setLongEdge] = React.useState('0')
  /** What a finished file depends on besides its own edits. */
  const settingsKey = JSON.stringify([settings, longEdge])
  const outputKey = (it: BatchItem) => JSON.stringify([settingsKey, it.edits])
  // A file finished under other settings or edits counts as queued again, so the
  // ZIP never holds a format or size the settings no longer say.
  const items = storedItems.map((it) =>
    it.status === 'done' && it.key !== outputKey(it) ? { ...it, status: 'queued' as const, output: undefined, key: undefined } : it
  )
  const [running, setRunning] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<{ id: string; image: DecodedImage } | null>(null)

  const patch = (id: string, p: Partial<BatchItem>) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)))

  const add = (files: File[]) => {
    const problems: string[] = []
    const room = MAX_BATCH - items.length
    const accepted: BatchItem[] = []
    for (const f of files) {
      const p = validate(f)
      if (p) problems.push(p)
      else if (accepted.length < room) accepted.push({ id: crypto.randomUUID(), file: f, edits: NO_EDITS, status: 'queued' })
    }
    if (files.length - problems.length > room) problems.push(`Only ${MAX_BATCH} images fit in one batch.`)
    setNotice(problems.length ? problems.join(' ') : null)
    setItems((prev) => [...prev, ...accepted])
    for (const it of accepted) {
      void readMetadata(it.file).then((r) => patch(it.id, { hasLocation: Boolean(r?.hasLocation) }))
    }
  }

  usePasteImages(add)

  const openEditor = async (item: BatchItem) => {
    try {
      setEditing({ id: item.id, image: await decodeImage(item.file) })
    } catch (e) {
      patch(item.id, { status: 'error', error: e instanceof Error ? e.message : 'Could not open this image.' })
    }
  }

  const convertAll = async () => {
    setRunning(true)
    for (const item of items) {
      patch(item.id, { status: 'working', error: undefined })
      try {
        const img = await decodeImage(item.file)
        const [ew, eh] = editedSize(img.width, img.height, item.edits)
        const [w, h] = Number(longEdge) > 0 ? fitLongEdge(ew, eh, Number(longEdge)) : [ew, eh]
        const canvas = renderEdited(img, item.edits, w, h, settings.format === 'image/jpeg')
        const { blob: output } = await encodeOutput(canvas, item.file, settings, { width: w, height: h })
        patch(item.id, { status: 'done', output, format: settings.format, key: outputKey(item) })
      } catch (e) {
        patch(item.id, { status: 'error', error: e instanceof Error ? e.message : 'Conversion failed.' })
      }
    }
    setRunning(false)
  }

  const done = items.filter((i) => i.status === 'done' && i.output)
  const totalIn = done.reduce((s, i) => s + i.file.size, 0)
  const totalOut = done.reduce((s, i) => s + (i.output?.size ?? 0), 0)
  const finished = items.filter((i) => i.status === 'done' || i.status === 'error').length
  const progress = items.length ? Math.round((finished / items.length) * 100) : 0
  const withLocation = items.filter((i) => i.hasLocation).length

  const downloadZip = async () => {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    const used = new Map<string, number>()
    for (const it of done) {
      // Named from the format it was actually encoded in, not the current setting.
      let name = outputFilename(it.file.name, it.format ?? settings.format)
      const n = used.get(name) ?? 0
      used.set(name, n + 1)
      if (n > 0) name = name.replace(/(\.[^.]+)$/, `-${n + 1}$1`)
      zip.file(name, it.output!)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'utilities-my-images.zip', isIOSOrSafari())
    toast({ title: 'ZIP saved', description: `${done.length} image${done.length === 1 ? '' : 's'}, ${humanSize(blob.size)}` })
  }

  const metadataNote =
    settings.metaMode === 'strip'
      ? 'Camera details, dates and location are removed from every file.'
      : 'Kept only for JPEG files converted to JPEG; removed from everything else.'

  const editingItem = editing ? items.find((x) => x.id === editing.id) : undefined

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
      <Card className="minimal-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
          <CardTitle className="font-headline text-lg">
            Images ({items.length}/{MAX_BATCH})
          </CardTitle>
          <ClearButton
            onClear={() => setItems([])}
            hasContent={items.length > 0}
            disabled={running}
            label="Clear all"
            confirmLabel="Clear all images"
            confirmTitle="Clear every image?"
            confirmDescription="All images and converted results in this batch will be removed."
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <DropZone multiple onFiles={add} compact={items.length > 0} />
          {notice && <p className="text-sm text-warning">{notice}</p>}
          {withLocation > 0 && (
            <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              {withLocation} of these photos record where they were taken. That&apos;s removed on conversion unless you keep metadata.
            </p>
          )}
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2.5">
                <BatchThumb file={it.file} />
                <div className="min-w-0 flex-1 text-sm">
                  <Hint label={it.file.name}>
                    <p className="truncate font-medium">{it.file.name}</p>
                  </Hint>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {it.status === 'done' && it.output ? <SizeChange from={it.file.size} to={it.output.size} /> : <span className="tabular-nums">{humanSize(it.file.size)}</span>}
                    {it.hasLocation && (
                      <Badge variant="outline" className="gap-1 border-warning/50 text-[10px] text-warning">
                        <MapPin className="h-3 w-3" /> Location
                      </Badge>
                    )}
                    {hasEdits(it.edits) && (
                      <Badge variant="secondary" className="text-[10px]">
                        Edited
                      </Badge>
                    )}
                    {it.status === 'error' && <span className="text-destructive">{it.error}</span>}
                  </div>
                </div>
                {it.status === 'working' && <Spinner className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Converting" />}
                {it.status === 'done' && <CheckCircle className="h-4 w-4 text-success" aria-label="Done" />}
                {it.status === 'error' && <Warning className="h-4 w-4 text-destructive" aria-label="Failed" />}
                <Button variant="ghost" size="icon-sm" onClick={() => void openEditor(it)} disabled={running} title="Crop, rotate, flip">
                  <PencilSimple className="h-4 w-4" />
                </Button>
                {it.status === 'done' && it.output && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => downloadBlob(it.output!, outputFilename(it.file.name, settings.format), isIOSOrSafari())}
                    title="Download this image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                  disabled={running}
                  title="Remove from batch"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="minimal-card lg:sticky lg:top-20">
        <CardHeader className="pb-3">
          <CardTitle className="font-headline text-lg">Output for all images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="long-edge">Size</Label>
            <Select value={longEdge} onValueChange={setLongEdge}>
              <SelectTrigger id="long-edge" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LONG_EDGES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Images are only ever shrunk, never enlarged. The aspect ratio is kept.</p>
          </div>
          <OutputControls settings={settings} onChange={(p) => setSettings((s) => ({ ...s, ...p }))} metadataNote={metadataNote} />

          {(running || done.length > 0) && (
            <div className="space-y-2">
              <Progress value={progress} />
              {done.length > 0 && (
                <p className="text-sm">
                  Total: <SizeChange from={totalIn} to={totalOut} />
                </p>
              )}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => void convertAll()} disabled={!items.length || running} className="h-11">
              {running ? <Spinner className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? 'Converting…' : items.length ? `Convert ${items.length}` : 'Convert'}
            </Button>
            <Button variant="outline" onClick={() => void downloadZip()} disabled={!done.length || running} className="h-11">
              <Archive className="h-4 w-4" /> Download ZIP
            </Button>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <ImageEditorDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          image={editing.image}
          initial={editingItem?.edits ?? NO_EDITS}
          onApply={(e) => patch(editing.id, { edits: e, status: 'queued', output: undefined })}
          name={editingItem?.file.name}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ImageConverterPage() {
  const [mode, setMode] = React.useState<'single' | 'batch'>('single')
  const [settings, setSettings] = React.useState<OutputSettings>({
    format: 'image/webp',
    quality: 0.85,
    useTarget: false,
    targetKb: '500',
    metaMode: 'strip',
  })

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={ImageIcon} title="Image Converter" />
        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            <div className="mb-2 max-sm:sr-only">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground border-b border-border pb-3 sm:pb-4">Image Converter</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
                Change a picture&apos;s format or size, crop it, see exactly what&apos;s inside it, and know the file size before you download. Nothing is
                uploaded.
              </p>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'batch')} className="gap-6">
              <TabsList className="grid w-full grid-cols-2 sm:w-fit">
                <TabsTrigger value="single">
                  <ImageIcon className="h-4 w-4" /> One image
                </TabsTrigger>
                <TabsTrigger value="batch">
                  <Stack className="h-4 w-4" /> Many images
                </TabsTrigger>
              </TabsList>
              <TabsContent value="single">
                <SingleConverter settings={settings} setSettings={setSettings} />
              </TabsContent>
              <TabsContent value="batch">
                <BatchConverter settings={settings} setSettings={setSettings} />
              </TabsContent>
            </Tabs>

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardText className="h-3.5 w-3.5" /> Tip: copy an image anywhere, then paste it here to start.
            </p>
          </div>
        </div>
        <ToolMethodology />
      </SidebarInset>
    </>
  )
}

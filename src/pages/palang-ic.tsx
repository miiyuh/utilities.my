import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  IdentificationCard,
  FilePdf,
  Image as ImageIcon,
  LockSimple,
  ArrowCounterClockwise,
  ArrowSquareOut,
  Check,
  X,
  Warning,
} from 'phosphor-react'
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar'
import { SidebarContent } from '@/components/sidebar-content'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorPicker } from '@/components/ui/color-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { downloadBlob, isIOSOrSafari, validateImageFile } from '@/lib/image-utils'
import {
  CARD_H_PX,
  CARD_W_PX,
  DEFAULT_BAND,
  DEFAULT_COLOR,
  DEFAULT_TILED,
  LAYOUTS,
  LAYOUT_IDS,
  MKN_GUIDANCE_URL,
  PLACEMENTS,
  PRESETS,
  buildPalangPdf,
  canvasToPngBlob,
  computeCoverage,
  defaultCrop,
  ensureFonts,
  keyZones,
  loadCardSource,
  loadPersisted,
  releaseSide,
  renderWatermarkedCard,
  resolveBandGeometry,
  resolveLines,
  savePersisted,
  type BandPlacement,
  type CardSide,
  type CropRect,
  type LayoutId,
  type PresetId,
  type Rotation,
  type SideKey,
  type Sides,
  type WatermarkOptions,
  type ZoneCoverage,
} from '@/lib/palang-ic'
import { SideUpload } from '@/components/palang-ic/side-upload'
import { CropEditor } from '@/components/palang-ic/crop-editor'
import { CardPreview } from '@/components/palang-ic/card-preview'

const SIDE_LABEL: Record<SideKey, 'Front' | 'Back'> = { front: 'Front', back: 'Back' }
const QUICK_COLORS: Array<{ hex: string; name: string }> = [
  { hex: '#111111', name: 'Black' },
  { hex: '#b91c1c', name: 'Red' },
  { hex: '#1d4ed8', name: 'Blue' },
]

interface EditingState {
  key: SideKey
  rotation: Rotation
  crop: CropRect
}

function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2.5 font-headline text-lg tracking-tight md:text-xl">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground">
        {n}
      </span>
      {children}
    </CardTitle>
  )
}

function SliderRow({
  id,
  label,
  value,
  display,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  id: string
  label: string
  value: number
  display: string
  min: number
  max: number
  step: number
  disabled?: boolean
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className={disabled ? 'text-muted-foreground' : undefined}>
          {label}
        </Label>
        <span className="font-mono text-xs text-muted-foreground">{display}</span>
      </div>
      <Slider
        id={id}
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

function CoverageChips({ zones, tiled }: { zones: ZoneCoverage[]; tiled: boolean }) {
  if (zones.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Field coverage">
      {tiled && (
        <Badge variant="secondary" className="gap-1">
          <Check className="h-3 w-3" />
          Tiled: whole card
        </Badge>
      )}
      {zones.map((z) => (
        <Badge
          key={z.id}
          variant={z.covered ? 'secondary' : z.key ? 'destructive' : 'outline'}
          className="gap-1"
          title={z.covered ? `Crossed by the ${z.by === 'shield' ? 'QR shield' : 'lines'}` : 'Not crossed by the lines'}
        >
          {z.covered ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {z.label}
        </Badge>
      ))}
    </div>
  )
}

export default function PalangIc() {
  const { toast } = useToast()
  const [sides, setSides] = useState<Sides>({ front: null, back: null })
  const [options, setOptions] = useState<WatermarkOptions>(loadPersisted)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [loadingSide, setLoadingSide] = useState<SideKey | null>(null)
  const [exporting, setExporting] = useState<'pdf' | SideKey | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
  const [showZones, setShowZones] = useState(false)
  // Free-typed hex; only valid values are pushed into options.
  const [colorText, setColorText] = useState(() => options.color)
  const sidesRef = useRef(sides)
  // Monotonic per-side request ids so a slow, older decode can never
  // overwrite a newer upload.
  const loadSeq = useRef<Record<SideKey, number>>({ front: 0, back: 0 })
  useEffect(() => {
    sidesRef.current = sides
  }, [sides])

  useEffect(() => {
    let active = true
    void ensureFonts().then(() => {
      if (active) setFontsReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    savePersisted(options)
  }, [options])

  // Release bitmaps and object URLs when the page unmounts.
  useEffect(
    () => () => {
      releaseSide(sidesRef.current.front)
      releaseSide(sidesRef.current.back)
    },
    [],
  )

  const patch = useCallback((p: Partial<WatermarkOptions>) => setOptions((o) => ({ ...o, ...p })), [])
  const patchBand = (p: Partial<WatermarkOptions['band']>) => setOptions((o) => ({ ...o, band: { ...o.band, ...p } }))
  const patchTiled = (p: Partial<WatermarkOptions['tiled']>) => setOptions((o) => ({ ...o, tiled: { ...o.tiled, ...p } }))

  const handleFile = useCallback(
    async (key: SideKey, file: File) => {
      const check = validateImageFile(file)
      if (!check.valid) {
        toast({ title: 'Could not use that file', description: check.error, variant: 'destructive' })
        return
      }
      const seq = ++loadSeq.current[key]
      setLoadingSide(key)
      try {
        const loaded = await loadCardSource(file)
        if (seq !== loadSeq.current[key]) {
          if ('close' in loaded.source) loaded.source.close()
          return
        }
        const side: CardSide = {
          file,
          objectUrl: URL.createObjectURL(file),
          source: loaded.source,
          width: loaded.width,
          height: loaded.height,
          rotation: 0,
          crop: defaultCrop(loaded.width, loaded.height),
        }
        setSides((s) => {
          releaseSide(s[key])
          return { ...s, [key]: side }
        })
        // A phone photo almost always needs cropping, so go straight there.
        setEditing({ key, rotation: side.rotation, crop: side.crop })
      } catch (error) {
        if (seq !== loadSeq.current[key]) return
        toast({
          title: 'Could not read that image',
          description: error instanceof Error ? error.message : 'Unsupported image format. Please use JPG or PNG.',
          variant: 'destructive',
        })
      } finally {
        if (seq === loadSeq.current[key]) setLoadingSide(null)
      }
    },
    [toast],
  )

  const handleFront = useCallback((f: File) => void handleFile('front', f), [handleFile])
  const handleBack = useCallback((f: File) => void handleFile('back', f), [handleFile])

  const removeSide = (key: SideKey) => {
    // Invalidate any decode still in flight for this side so a replacement
    // that finishes after Remove cannot bring the image back.
    loadSeq.current[key]++
    setLoadingSide((l) => (l === key ? null : l))
    setSides((s) => {
      releaseSide(s[key])
      return { ...s, [key]: null }
    })
  }

  const openEditor = (key: SideKey) => {
    const side = sides[key]
    if (side) setEditing({ key, rotation: side.rotation, crop: side.crop })
  }

  const applyEdit = () => {
    if (!editing) return
    const { key, rotation, crop } = editing
    setSides((s) => (s[key] ? { ...s, [key]: { ...s[key], rotation, crop } } : s))
    setEditing(null)
  }

  const lines = resolveLines(options)
  const hasPurpose = options.purpose.trim().length > 0
  const hasSide = Boolean(sides.front || sides.back)
  // Never let an unmarked copy out: at least one layer on and text to draw.
  const hasMarking = (options.band.enabled || options.tiled.enabled) && lines.length > 0
  const canExport = hasPurpose && hasSide && hasMarking && exporting === null
  const exportBlocker = !hasSide
    ? 'Add the front or back of the card first.'
    : !hasPurpose
      ? 'Type the purpose (tujuan) first.'
      : !hasMarking
        ? 'Turn on the band or the tiled watermark, and make sure there is text to stamp.'
        : null

  // Memoised: the preview's debounce restarts whenever the guides prop changes identity.
  const coverage = useMemo(
    () => ({ front: computeCoverage('front', options), back: computeCoverage('back', options) }),
    [options],
  )
  const isGenericLayout = options.layout === 'generic'
  const autoAngle = options.band.placement === 'fields' && keyZones(options.layout, 'front').length >= 2
  const frontTheta = resolveBandGeometry('front', CARD_W_PX, CARD_H_PX, options).theta
  const angleDisplay =
    options.band.placement === 'corner'
      ? '−45° (fixed)'
      : autoAngle
        ? `Auto (${Math.round((frontTheta * 180) / Math.PI)}° front)`
        : `${options.band.angle}°`
  const placementHint = PLACEMENTS.find((p) => p.id === options.band.placement)?.hint ?? ''
  const missedKey = (['front', 'back'] as SideKey[])
    .filter((k) => sides[k])
    .flatMap((k) => coverage[k].filter((z) => z.key && !z.covered).map((z) => `${z.label} (${SIDE_LABEL[k].toLowerCase()})`))
  const showCoverageWarning = missedKey.length > 0 && !options.tiled.enabled && !isGenericLayout

  const exportPdf = async () => {
    if (!canExport) return
    setExporting('pdf')
    try {
      const front = sides.front ? renderWatermarkedCard(sides.front, options, 'front') : undefined
      const back = sides.back ? renderWatermarkedCard(sides.back, options, 'back') : undefined
      const blob = await buildPalangPdf({ front, back }, lines.join(' | '))
      downloadBlob(blob, `palang-ic-${options.date}.pdf`, isIOSOrSafari())
      toast({
        title: 'PDF downloaded',
        description: `${front && back ? 'Both sides' : 'One side'} at real card size on one A4 page.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'PDF export failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setExporting(null)
    }
  }

  const exportPng = async (key: SideKey) => {
    const side = sides[key]
    if (!side || !canExport) return
    setExporting(key)
    try {
      const blob = await canvasToPngBlob(renderWatermarkedCard(side, options, key))
      downloadBlob(blob, `palang-ic-${key}-${options.date}.png`, isIOSOrSafari())
      toast({ title: `${SIDE_LABEL[key]} PNG downloaded`, variant: 'success' })
    } catch (error) {
      toast({
        title: 'PNG export failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setExporting(null)
    }
  }

  // Stable and bail-on-equal: ColorPicker re-notifies whenever its onChange
  // identity changes, so an inline arrow that always produces a new options
  // object would loop forever.
  const setColor = useCallback((hex: string) => {
    const next = hex.toLowerCase()
    setColorText(next)
    setOptions((o) => (o.color === next ? o : { ...o, color: next }))
  }, [])

  const resetStyle = () => {
    setColorText(DEFAULT_COLOR)
    patch({ band: DEFAULT_BAND, tiled: DEFAULT_TILED, color: DEFAULT_COLOR, qrShield: true })
  }

  const editingSide = editing ? sides[editing.key] : null
  // Show both slots when neither or both sides exist; a lone side gets the
  // full width so the watermark can actually be inspected.
  const previewKeys: SideKey[] =
    Boolean(sides.front) === Boolean(sides.back) ? ['front', 'back'] : sides.front ? ['front'] : ['back']

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={IdentificationCard} title="Palang IC" />

        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8 hidden sm:block">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground border-b border-border pb-3 sm:pb-4">
                Palang IC
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Watermark a MyKad copy so it can only be used for one purpose. Front and back, exported as an A4 PDF
                at real card size — nothing leaves your device.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              {/* Left column: steps 1–3 */}
              <div className="space-y-6">
                <Card className="minimal-card">
                  <CardHeader className="pb-3 md:pb-4">
                    <StepTitle n={1}>Upload the card</StepTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <SideUpload
                        label="Front"
                        hint="Required for most forms"
                        side={sides.front}
                        busy={loadingSide === 'front'}
                        onFile={handleFront}
                        onRemove={() => removeSide('front')}
                        onEdit={() => openEditor('front')}
                      />
                      <SideUpload
                        label="Back"
                        hint="Optional"
                        side={sides.back}
                        busy={loadingSide === 'back'}
                        onFile={handleBack}
                        onRemove={() => removeSide('back')}
                        onEdit={() => openEditor('back')}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A phone photo is fine — you will crop it to the card edges next. Back is optional; add it if the
                      form asks for both sides.
                    </p>
                    <div className="space-y-2 border-t border-border pt-4">
                      <Label htmlFor="layout">Card layout</Label>
                      <Select value={options.layout} onValueChange={(v) => patch({ layout: v as LayoutId })}>
                        <SelectTrigger id="layout" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LAYOUT_IDS.map((id) => (
                            <SelectItem key={id} value={id}>
                              {LAYOUTS[id].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Tells the tool where the photo, IC number and QR code sit so the lines can be aimed at them.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3 md:pb-4">
                    <StepTitle n={2}>Write the purpose</StepTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="preset">Template</Label>
                      <Select value={options.presetId} onValueChange={(v) => patch({ presetId: v as PresetId })}>
                        <SelectTrigger id="preset" className="w-full">
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESETS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose (tujuan)</Label>
                        <Input
                          id="purpose"
                          value={options.purpose}
                          onChange={(e) => patch({ purpose: e.target.value.toUpperCase() })}
                          placeholder="e.g. PEMBUKAAN AKAUN BANK"
                          className="uppercase"
                          maxLength={80}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient (optional)</Label>
                        <Input
                          id="recipient"
                          value={options.recipient}
                          onChange={(e) => patch({ recipient: e.target.value.toUpperCase() })}
                          placeholder="e.g. MAYBANK"
                          className="uppercase"
                          maxLength={60}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={options.date}
                        onChange={(e) => patch({ date: e.target.value })}
                        className="w-full sm:max-w-[220px]"
                      />
                    </div>

                    {options.presetId === 'custom' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-fast">
                        <Label htmlFor="custom">Custom lines</Label>
                        <Textarea
                          id="custom"
                          value={options.customLines}
                          onChange={(e) => patch({ customLines: e.target.value })}
                          rows={3}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          One line per row. Use <code>{'{PURPOSE}'}</code>, <code>{'{RECIPIENT}'}</code> and{' '}
                          <code>{'{DATE}'}</code> as placeholders.
                        </p>
                      </div>
                    )}

                    <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Text on the copy
                      </p>
                      {lines.length ? (
                        lines.map((l, i) => (
                          <p key={i} className="font-mono text-sm text-foreground">
                            {l}
                          </p>
                        ))
                      ) : (
                        <p className="font-mono text-sm text-muted-foreground">(nothing yet)</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3 md:pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <StepTitle n={3}>Style</StepTitle>
                      <Button type="button" variant="ghost" size="xs" onClick={resetStyle}>
                        <ArrowCounterClockwise className="h-3.5 w-3.5" />
                        Reset
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <section className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label htmlFor="band-enabled" className="text-sm font-medium">
                            Two-line band
                          </Label>
                          <p className="text-xs text-muted-foreground">The marking JPN recommends: two lines with the purpose between them.</p>
                        </div>
                        <Switch
                          id="band-enabled"
                          checked={options.band.enabled}
                          onCheckedChange={(enabled) => patchBand({ enabled })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="placement" className={!options.band.enabled ? 'text-muted-foreground' : undefined}>
                          Placement
                        </Label>
                        <Select
                          value={options.band.placement}
                          onValueChange={(v) => patchBand({ placement: v as BandPlacement })}
                          disabled={!options.band.enabled}
                        >
                          <SelectTrigger id="placement" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLACEMENTS.map((p) => (
                              <SelectItem key={p.id} value={p.id} disabled={p.id === 'fields' && isGenericLayout}>
                                {p.label}
                                {p.id === 'fields' && isGenericLayout ? ' (needs a MyKad layout)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {options.band.placement === 'fields' && isGenericLayout
                            ? 'No field map for a generic card, so the band runs straight through the centre.'
                            : placementHint}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SliderRow id="band-angle" label="Angle" value={options.band.angle} display={angleDisplay} min={-60} max={60} step={1} disabled={!options.band.enabled || options.band.placement === 'corner' || autoAngle} onChange={(angle) => patchBand({ angle })} />
                        <SliderRow id="band-opacity" label="Opacity" value={options.band.opacity} display={`${Math.round(options.band.opacity * 100)}%`} min={0.3} max={1} step={0.05} disabled={!options.band.enabled} onChange={(opacity) => patchBand({ opacity })} />
                        <SliderRow id="band-gap" label="Gap between lines" value={options.band.gap} display={`${Math.round(options.band.gap * 100)}%`} min={0.12} max={0.4} step={0.01} disabled={!options.band.enabled} onChange={(gap) => patchBand({ gap })} />
                        <SliderRow id="band-line" label="Line thickness" value={options.band.lineWidth} display={`${options.band.lineWidth}px`} min={2} max={12} step={1} disabled={!options.band.enabled} onChange={(lineWidth) => patchBand({ lineWidth })} />
                        <SliderRow id="band-font" label="Text size" value={options.band.fontSize} display={`${options.band.fontSize}px`} min={24} max={72} step={1} disabled={!options.band.enabled} onChange={(fontSize) => patchBand({ fontSize })} />
                      </div>
                    </section>

                    <section className="space-y-4 border-t border-border pt-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label htmlFor="tiled-enabled" className="text-sm font-medium">
                            Tiled watermark
                          </Label>
                          <p className="text-xs text-muted-foreground">Faint repeat across the whole card, over the photo and IC number, so it cannot be cropped out.</p>
                        </div>
                        <Switch
                          id="tiled-enabled"
                          checked={options.tiled.enabled}
                          onCheckedChange={(enabled) => patchTiled({ enabled })}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SliderRow id="tiled-opacity" label="Opacity" value={options.tiled.opacity} display={`${Math.round(options.tiled.opacity * 100)}%`} min={0.05} max={0.5} step={0.01} disabled={!options.tiled.enabled} onChange={(opacity) => patchTiled({ opacity })} />
                        <SliderRow id="tiled-angle" label="Angle" value={options.tiled.angle} display={`${options.tiled.angle}°`} min={-60} max={60} step={1} disabled={!options.tiled.enabled} onChange={(angle) => patchTiled({ angle })} />
                        <SliderRow id="tiled-font" label="Text size" value={options.tiled.fontSize} display={`${options.tiled.fontSize}px`} min={16} max={48} step={1} disabled={!options.tiled.enabled} onChange={(fontSize) => patchTiled({ fontSize })} />
                        <SliderRow id="tiled-spacing" label="Row spacing" value={options.tiled.spacing} display={`${options.tiled.spacing.toFixed(1)}×`} min={1.5} max={4} step={0.1} disabled={!options.tiled.enabled} onChange={(spacing) => patchTiled({ spacing })} />
                      </div>
                    </section>

                    {options.layout === 'mykad-2026' && (
                      <section className="space-y-4 border-t border-border pt-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <Label htmlFor="qr-shield" className="text-sm font-medium">
                              Block the QR code (back)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Cross-hatch over the QR so enforcement readers cannot decode it from a copy. Banks and agencies never need it.
                            </p>
                          </div>
                          <Switch id="qr-shield" checked={options.qrShield} onCheckedChange={(qrShield) => patch({ qrShield })} />
                        </div>
                      </section>
                    )}

                    <section className="space-y-2 border-t border-border pt-6">
                      <Label htmlFor="color">Colour</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="color"
                          value={colorText}
                          onChange={(e) => {
                            const v = e.target.value
                            setColorText(v)
                            if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ color: v })
                          }}
                          onBlur={() => setColorText(options.color)}
                          className="w-32 font-mono"
                          spellCheck={false}
                        />
                        <ColorPicker value={options.color} onChange={setColor} />
                        <div className="ml-1 flex items-center gap-1.5">
                          {QUICK_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              aria-label={c.name}
                              title={c.name}
                              onClick={() => setColor(c.hex)}
                              className={`h-7 w-7 rounded-full border-2 transition-transform duration-quick hover:scale-110 ${
                                options.color.toLowerCase() === c.hex ? 'border-primary' : 'border-border'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </div>
                    </section>
                  </CardContent>
                </Card>
              </div>

              {/* Right column: preview & export */}
              <div className="space-y-6 lg:sticky lg:top-20">
                <Card className="minimal-card">
                  <CardHeader className="pb-3 md:pb-4">
                    <StepTitle n={4}>Preview &amp; download</StepTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isGenericLayout && (
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="show-zones" className="text-sm">
                          Show field zones
                        </Label>
                        <Switch id="show-zones" checked={showZones} onCheckedChange={setShowZones} />
                      </div>
                    )}
                    <div className={`grid grid-cols-1 gap-4 ${previewKeys.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                      {previewKeys.map((key) => (
                        <div key={key} className="space-y-2">
                          <CardPreview
                            label={SIDE_LABEL[key]}
                            sideKey={key}
                            side={sides[key]}
                            options={options}
                            fontsReady={fontsReady}
                            guides={showZones ? coverage[key] : undefined}
                          />
                          {sides[key] && <CoverageChips zones={coverage[key]} tiled={options.tiled.enabled} />}
                        </div>
                      ))}
                    </div>

                    {showCoverageWarning && (
                      <Alert variant="destructive">
                        <Warning className="h-4 w-4" />
                        <AlertTitle>The lines miss some identity fields</AlertTitle>
                        <AlertDescription>
                          Not crossed: {missedKey.join(', ')}. Turn on the tiled watermark or change the placement.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Alert>
                      <LockSimple className="h-4 w-4" />
                      <AlertTitle>Nothing leaves your device</AlertTitle>
                      <AlertDescription>
                        Images stay in memory in this tab and are gone when you close it. Only your text and style
                        settings are remembered.
                      </AlertDescription>
                    </Alert>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="sm:flex-1">
                            <Button type="button" className="w-full" disabled={!canExport} onClick={exportPdf}>
                              <FilePdf className="h-4 w-4" />
                              {exporting === 'pdf' ? 'Building PDF…' : 'Download PDF (A4)'}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {exportBlocker && <TooltipContent>{exportBlocker}</TooltipContent>}
                      </Tooltip>
                      <Button type="button" variant="outline" disabled={!canExport || !sides.front} onClick={() => exportPng('front')}>
                        <ImageIcon className="h-4 w-4" />
                        {exporting === 'front' ? 'Saving…' : 'PNG · Front'}
                      </Button>
                      <Button type="button" variant="outline" disabled={!canExport || !sides.back} onClick={() => exportPng('back')}>
                        <ImageIcon className="h-4 w-4" />
                        {exporting === 'back' ? 'Saving…' : 'PNG · Back'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The PDF places each side at 85.6 × 54 mm on one A4 page, so it prints at true card size.
                    </p>
                  </CardContent>
                </Card>

                <Accordion type="single" collapsible className="rounded-md border border-border">
                  <AccordionItem value="why" className="border-none">
                    <AccordionTrigger className="px-4 text-sm font-medium">Why palang a copy of your IC?</AccordionTrigger>
                    <AccordionContent className="space-y-3 px-4 text-sm text-muted-foreground">
                      <p>
                        A clean copy of a MyKad can be reused to open accounts, sign up for lines, or apply for loans in
                        your name. Jabatan Pendaftaran Negara and Majlis Keselamatan Negara advise drawing two straight
                        lines across every copy and writing what it is for between them.
                      </p>
                      <p>
                        The two-line band does exactly that — aimed through the photo and IC number by default, or across
                        the top-left corner like the JPN graphic if you prefer. The tiled layer goes further: it repeats
                        the purpose across the whole face, over the photo, name and IC number, at an opacity that varies
                        from tile to tile, so it cannot be cropped away or removed with a colour-select tool.
                      </p>
                      <p>
                        The MyKad issued from 17 September 2026 carries a QR code on the back that only JPN enforcement
                        devices can read. A bank or landlord never needs it, so the tool cross-hatches it by default to
                        stop a copy being replayed.
                      </p>
                      <p>
                        This tool follows the published guidance but is not affiliated with JPN or MKN.{' '}
                        <a
                          href={MKN_GUIDANCE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
                        >
                          Read the MKN advice
                          <ArrowSquareOut className="h-3.5 w-3.5" />
                        </a>
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Crop &amp; rotate — {editing ? SIDE_LABEL[editing.key] : ''}</DialogTitle>
              <DialogDescription>
                Drag the corners to fit the card edges. The box is locked to the MyKad shape.
              </DialogDescription>
            </DialogHeader>
            {editing && editingSide && (
              <CropEditor
                side={editingSide}
                rotation={editing.rotation}
                crop={editing.crop}
                onChange={(next) => setEditing((e) => (e ? { ...e, ...next } : e))}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyEdit}>
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </TooltipProvider>
  )
}

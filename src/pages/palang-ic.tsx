import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  IdentificationCard,
  FilePdf,
  Image as ImageIcon,
  LockSimple,
  ArrowCounterClockwise,
  ArrowSquareOut,
} from 'phosphor-react'
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar'
import { SidebarContent } from '@/components/sidebar-content'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorPicker } from '@/components/ui/color-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  DEFAULT_COLOR,
  DEFAULT_TILED,
  MKN_GUIDANCE_URL,
  PRESETS,
  buildPalangPdf,
  canvasToPngBlob,
  defaultCrop,
  ensureFonts,
  loadCardSource,
  loadPersisted,
  releaseSide,
  renderWatermarkedCard,
  resolveLines,
  savePersisted,
  type CardSide,
  type CropRect,
  type PresetId,
  type Rotation,
  type SideKey,
  type Sides,
  type WatermarkOptions,
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

export default function PalangIc() {
  const { toast } = useToast()
  const [sides, setSides] = useState<Sides>({ front: null, back: null })
  const [options, setOptions] = useState<WatermarkOptions>(loadPersisted)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [loadingSide, setLoadingSide] = useState<SideKey | null>(null)
  const [exporting, setExporting] = useState<'pdf' | SideKey | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
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
  // Never let an unmarked copy out: there has to be text to stamp.
  const canExport = hasPurpose && hasSide && lines.length > 0 && exporting === null
  const exportBlocker = !hasSide
    ? 'Add the front or back of the card first.'
    : !hasPurpose
      ? 'Type the purpose (tujuan) first.'
      : lines.length === 0
        ? 'The template produced no text to stamp.'
        : null

  const exportPdf = async () => {
    if (!canExport) return
    setExporting('pdf')
    try {
      const front = sides.front ? renderWatermarkedCard(sides.front, options) : undefined
      const back = sides.back ? renderWatermarkedCard(sides.back, options) : undefined
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
      const blob = await canvasToPngBlob(renderWatermarkedCard(side, options))
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
    patch({ tiled: DEFAULT_TILED, color: DEFAULT_COLOR })
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
                Stamp the purpose across a MyKad copy so it can only be used for that one thing. Front and back,
                exported as an A4 PDF at real card size — nothing leaves your device.
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
                      <StepTitle n={3}>Watermark style</StepTitle>
                      <Button type="button" variant="ghost" size="xs" onClick={resetStyle}>
                        <ArrowCounterClockwise className="h-3.5 w-3.5" />
                        Reset
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <section className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        The purpose is repeated across the whole card, over the photo, name and IC number, at an
                        opacity that varies tile to tile — so it cannot be cropped off or lifted out with a
                        colour-select tool.
                      </p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SliderRow id="tiled-opacity" label="Opacity" value={options.tiled.opacity} display={`${Math.round(options.tiled.opacity * 100)}%`} min={0.05} max={0.5} step={0.01} onChange={(opacity) => patchTiled({ opacity })} />
                        <SliderRow id="tiled-angle" label="Angle" value={options.tiled.angle} display={`${options.tiled.angle}°`} min={-60} max={60} step={1} onChange={(angle) => patchTiled({ angle })} />
                        <SliderRow id="tiled-font" label="Text size" value={options.tiled.fontSize} display={`${options.tiled.fontSize}px`} min={16} max={48} step={1} onChange={(fontSize) => patchTiled({ fontSize })} />
                        <SliderRow id="tiled-spacing" label="Row spacing" value={options.tiled.spacing} display={`${options.tiled.spacing.toFixed(1)}×`} min={1.5} max={4} step={0.1} onChange={(spacing) => patchTiled({ spacing })} />
                      </div>
                    </section>

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
                    <div className={`grid grid-cols-1 gap-4 ${previewKeys.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                      {previewKeys.map((key) => (
                        <CardPreview
                          key={key}
                          label={SIDE_LABEL[key]}
                          side={sides[key]}
                          options={options}
                          fontsReady={fontsReady}
                        />
                      ))}
                    </div>

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
                        This tool goes further than two lines in a corner. It repeats the purpose across the whole
                        card — over the photo, the name and the IC number — at an opacity that varies from tile to
                        tile. A corner marking can be cropped off and a solid line can be painted out, but a mark
                        spread over the identity fields themselves cannot be removed without destroying what the
                        fraudster came for.
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

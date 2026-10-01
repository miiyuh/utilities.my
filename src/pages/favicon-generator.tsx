import * as React from 'react'
import { AppWindow, Download, Archive, Upload, TextAa, Smiley, Image as ImageIcon, Warning, Moon } from 'phosphor-react'
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar'
import { SidebarContent } from '@/components/sidebar-content'
import { PageHeader } from '@/components/page-header'
import { ToolMethodology } from '@/components/tool-methodology'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorPicker } from '@/components/ui/color-picker'
import { CopyButton } from '@/components/ui/copy-button'
import { useToast } from '@/hooks/use-toast'
import { downloadBlob, isIOSOrSafari } from '@/lib/image-utils'
import { decodeImage, isAcceptedImage } from '@/lib/image-pipeline'
import {
  FONT_CHOICES,
  buildHtmlSnippet,
  buildIco,
  buildManifest,
  buildSvg,
  canBuildSvg,
  fontReady,
  hasTransparency,
  canvasToPng,
  renderFavicon,
  type FaviconShape,
  type FaviconSource,
  type FaviconStyle,
} from '@/lib/favicon'
import { cn } from '@/lib/utils'
import { EmojiPicker } from '@/components/emoji-picker'

const EMOJI_PICKS = ['⚡', '🔥', '🌿', '☕', '🚀', '💡', '🎯', '⭐', '📦', '🧭', '🍜', '🎨']
const PREVIEW_SIZES = [16, 32, 48, 180, 192, 512]

type SourceKind = 'text' | 'emoji' | 'image'

/** Colour setter that ignores no-op notifications (the picker re-emits on every render). */
function useHex(initial: string) {
  const [hex, setHex] = React.useState(initial)
  const set = React.useCallback((next: string) => setHex((cur) => (cur.toLowerCase() === next.toLowerCase() ? cur : next.toLowerCase())), [])
  return [hex, set] as const
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm transition-colors duration-quick',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60'
      )}
    >
      {children}
    </button>
  )
}

function BrowserTab({ icon, title, dark }: { icon: string; title: string; dark?: boolean }) {
  return (
    <div className={cn('overflow-hidden rounded-md border', dark ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-300 bg-neutral-200')}>
      <div className="flex items-end gap-1 px-2 pt-2">
        <div className={cn('flex h-8 max-w-56 flex-1 items-center gap-2 rounded-t-md px-3 text-xs', dark ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-neutral-800')}>
          <img src={icon} alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
          <span className="truncate">{title || 'My site'}</span>
          <span className="ml-auto opacity-50">×</span>
        </div>
      </div>
      <div className={cn('h-3', dark ? 'bg-neutral-800' : 'bg-white')} />
    </div>
  )
}

export default function FaviconGeneratorPage() {
  const { toast } = useToast()
  const [kind, setKind] = React.useState<SourceKind>('text')
  const [text, setText] = React.useState('U')
  const [fontId, setFontId] = React.useState('space')
  const [weight, setWeight] = React.useState(700)
  const [textColor, setTextColor] = useHex('#ffffff')
  const [emoji, setEmoji] = React.useState('⚡')
  const [image, setImage] = React.useState<{ image: ImageBitmap | HTMLImageElement; width: number; height: number; name: string } | null>(null)
  const [imageError, setImageError] = React.useState<string | null>(null)
  const [shape, setShape] = React.useState<FaviconShape>('rounded')
  const [transparent, setTransparent] = React.useState(false)
  const [bgColor, setBgColor] = useHex('#2f9e7a')
  const [padding, setPadding] = React.useState(0.12)
  const [appName, setAppName] = React.useState('My site')
  const [shortName, setShortName] = React.useState('My site')
  const [themeColor, setThemeColor] = useHex('#2f9e7a')
  // Dark-mode variant (browser tabs follow the system theme).
  const [darkOn, setDarkOn] = React.useState(false)
  const [darkTransparent, setDarkTransparent] = React.useState(false)
  /** A transparent dark-mode image is used as it is (no padding), without touching the main icon's padding. */
  const [darkImageAsIs, setDarkImageAsIs] = React.useState(false)
  const [darkBg, setDarkBg] = useHex('#e6f4ee')
  const [darkTextColor, setDarkTextColor] = useHex('#155e46')
  const [darkImage, setDarkImage] = React.useState<{ image: ImageBitmap | HTMLImageElement; width: number; height: number; name: string } | null>(null)
  const darkFileRef = React.useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = React.useState<Record<string, string>>({})
  const [building, setBuilding] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const font = FONT_CHOICES.find((f) => f.id === fontId) ?? FONT_CHOICES[0]

  const source = React.useMemo<FaviconSource | null>(() => {
    if (kind === 'text') return { kind: 'text', text: text.trim(), font: font.css, weight, color: textColor }
    if (kind === 'emoji') return { kind: 'emoji', emoji: emoji.trim() }
    return image ? { kind: 'image', image: image.image, width: image.width, height: image.height } : null
  }, [kind, text, font.css, weight, textColor, emoji, image])

  const style = React.useMemo<FaviconStyle>(() => ({ shape, background: transparent ? null : bgColor, padding }), [shape, transparent, bgColor, padding])

  const darkSource = React.useMemo<FaviconSource | null>(() => {
    if (!darkOn || !source) return null
    if (source.kind === 'text') return { ...source, color: darkTextColor }
    if (source.kind === 'image' && darkImage) return { kind: 'image', image: darkImage.image, width: darkImage.width, height: darkImage.height }
    return source
  }, [darkOn, source, darkTextColor, darkImage])
  const darkStyle = React.useMemo<FaviconStyle>(
    () => ({ ...style, background: darkTransparent ? null : darkBg, padding: darkImageAsIs && darkImage ? 0 : style.padding }),
    [style, darkTransparent, darkBg, darkImageAsIs, darkImage]
  )

  // Previews redraw whenever the design changes (after the chosen font is ready).
  React.useEffect(() => {
    if (!source) {
      setPreviews({})
      return
    }
    let cancelled = false
    void (async () => {
      await fontReady(source)
      if (cancelled) return
      const next: Record<string, string> = {}
      for (const s of PREVIEW_SIZES) next[s] = renderFavicon(s, source, style).toDataURL('image/png')
      next.apple = renderFavicon(180, source, { ...style, shape: 'square' }, { opaque: '#ffffff' }).toDataURL('image/png')
      next.maskable = renderFavicon(192, source, style, { maskable: true }).toDataURL('image/png')
      if (darkSource) next.dark32 = renderFavicon(32, darkSource, darkStyle).toDataURL('image/png')
      setPreviews(next)
    })()
    return () => {
      cancelled = true
    }
  }, [source, style, darkSource, darkStyle])

  const loadImage = async (file: File | undefined) => {
    if (!file) return
    if (!isAcceptedImage(file) && file.type !== 'image/svg+xml') {
      setImageError(`${file.name} isn't an image.`)
      return
    }
    try {
      const img = await decodeImage(file)
      setImage({ ...img, image: img.source, name: file.name })
      setImageError(null)
      setKind('image')
      // A logo with see-through areas is meant to be used as it is: no background, no padding.
      if (hasTransparency(img.source, img.width, img.height)) {
        setTransparent(true)
        setPadding(0)
      }
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'This image could not be opened.')
    }
  }

  const loadDarkImage = async (file: File | undefined) => {
    if (!file) return
    try {
      const img = await decodeImage(file)
      setDarkImage({ ...img, image: img.source, name: file.name })
      const seeThrough = hasTransparency(img.source, img.width, img.height)
      setDarkImageAsIs(seeThrough)
      if (seeThrough) setDarkTransparent(true)
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'This image could not be opened.')
    }
  }

  React.useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/'))
      if (f) {
        e.preventDefault()
        void loadImage(f)
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  })

  const svgAvailable = source ? canBuildSvg(source) : false
  const snippet = buildHtmlSnippet(svgAvailable, themeColor, Boolean(darkSource))

  const downloadPackage = async () => {
    if (!source) return
    setBuilding(true)
    try {
      // Everything is drawn after the font has loaded, so no file is made with a fallback font.
      await fontReady(source)
      const png = (size: number, opts?: Parameters<typeof renderFavicon>[3], s: FaviconStyle = style) => canvasToPng(renderFavicon(size, source, s, opts))
      const [p16, p32, p48] = await Promise.all([png(16), png(32), png(48)])
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      zip.file('favicon.ico', await buildIco([{ size: 16, blob: p16 }, { size: 32, blob: p32 }, { size: 48, blob: p48 }]))
      zip.file('favicon-16x16.png', p16)
      zip.file('favicon-32x32.png', p32)
      if (darkSource) {
        zip.file('favicon-dark-16x16.png', await canvasToPng(renderFavicon(16, darkSource, darkStyle)))
        zip.file('favicon-dark-32x32.png', await canvasToPng(renderFavicon(32, darkSource, darkStyle)))
      }
      // iOS draws transparent pixels black and applies its own rounded mask.
      zip.file('apple-touch-icon.png', await png(180, { opaque: bgColor }, { ...style, shape: 'square', background: style.background ?? '#ffffff' }))
      zip.file('android-chrome-192x192.png', await png(192))
      zip.file('android-chrome-512x512.png', await png(512))
      zip.file('maskable-icon-512x512.png', await png(512, { maskable: true }))
      const svg = buildSvg(source, style, darkOn ? { background: darkStyle.background, color: darkTextColor } : undefined)
      if (svg) zip.file('favicon.svg', svg)
      zip.file('site.webmanifest', buildManifest(appName, shortName, themeColor, style.background ?? '#ffffff'))
      zip.file('README.txt', `Put these files in your site's root folder, then add this to the <head> of every page:\n\n${snippet}\n`)
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, 'favicon-package.zip', isIOSOrSafari())
      toast({ title: 'Favicon package saved', description: 'Unzip it into your site root and paste the HTML snippet into <head>.' })
    } catch (e) {
      toast({ title: 'Could not build the package', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setBuilding(false)
    }
  }

  const downloadIco = async () => {
    if (!source) return
    await fontReady(source)
    const blobs = await Promise.all([16, 32, 48].map(async (size) => ({ size, blob: await canvasToPng(renderFavicon(size, source, style)) })))
    downloadBlob(await buildIco(blobs), 'favicon.ico', isIOSOrSafari())
  }

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={AppWindow} title="Favicon Generator" />
        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            <div className="mb-2 max-sm:sr-only">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground border-b border-border pb-3 sm:pb-4">Favicon Generator</h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">
                Make every icon your site needs from a letter, an emoji or an image: browser tabs, iPhone and Android home screens, and the code to add them.
              </p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start">
              <div className="space-y-6">
                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Start from</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={kind} onValueChange={(v) => setKind(v as SourceKind)} className="gap-5">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="text"><TextAa className="h-4 w-4" /> Text</TabsTrigger>
                        <TabsTrigger value="emoji"><Smiley className="h-4 w-4" /> Emoji</TabsTrigger>
                        <TabsTrigger value="image"><ImageIcon className="h-4 w-4" /> Image</TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="fav-text">Letters (up to 3)</Label>
                            <Input id="fav-text" value={text} maxLength={3} onChange={(e) => setText(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="fav-font">Font</Label>
                            <Select value={fontId} onValueChange={setFontId}>
                              <SelectTrigger id="fav-font" className="w-full"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FONT_CHOICES.map((f) => (
                                  <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-8 gap-y-4">
                          <div className="space-y-2">
                            <span className="block text-sm font-medium" aria-hidden>Weight</span>
                            <fieldset className="flex flex-wrap gap-1.5">
                              <legend className="sr-only">Weight</legend>
                              {[
                                [400, 'Regular'],
                                [600, 'Semibold'],
                                [700, 'Bold'],
                              ].map(([w, label]) => (
                                <Chip key={w} active={weight === w} onClick={() => setWeight(Number(w))}>{label}</Chip>
                              ))}
                            </fieldset>
                          </div>
                          <div className="space-y-2">
                            <span className="block text-sm font-medium">Text colour</span>
                            <ColorPicker value={textColor} onChange={setTextColor} className="h-8 w-8" />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="emoji" className="space-y-4">
                        <div className="flex flex-wrap items-end gap-3">
                          <EmojiPicker value={emoji} onChange={setEmoji} />
                          <div className="space-y-1.5">
                            <Label htmlFor="fav-emoji">Or type / paste one</Label>
                            <Input id="fav-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="h-10 w-28 text-xl" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Quick picks:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {EMOJI_PICKS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => setEmoji(e)}
                              aria-pressed={emoji === e}
                              aria-label={`Use ${e}`}
                              className={cn('h-10 w-10 rounded-md border text-xl transition-colors duration-quick', emoji === e ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/60')}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="image" className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="outline" onClick={() => fileRef.current?.click()}>
                            <Upload className="h-4 w-4" /> {image ? 'Choose another image' : 'Choose an image'}
                          </Button>
                          {image && <span className="truncate text-sm text-muted-foreground">{image.name} · {image.width} × {image.height} px</span>}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { void loadImage(e.target.files?.[0]); e.target.value = '' }} />
                        <p className="text-xs text-muted-foreground">
                          A square image of at least 512 × 512 px works best. SVG, PNG, JPEG and WebP all work, and you can paste one too.
                        </p>
                        {imageError && (
                          <p className="flex items-start gap-2 text-sm text-destructive"><Warning className="mt-0.5 h-4 w-4 shrink-0" /> {imageError}</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Style</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <span className="block text-sm font-medium">Background</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <fieldset className="flex flex-wrap gap-1.5">
                          <legend className="sr-only">Background</legend>
                          <Chip active={!transparent} onClick={() => setTransparent(false)}>Colour</Chip>
                          <Chip active={transparent} onClick={() => setTransparent(true)}>None</Chip>
                        </fieldset>
                        {!transparent && <ColorPicker value={bgColor} onChange={setBgColor} className="h-8 w-8" />}
                      </div>
                      {transparent && (
                        <p className="text-xs text-muted-foreground">
                          Nothing is drawn behind your {kind === 'image' ? 'image' : kind} and nothing is cut off, so transparent areas stay transparent.
                          The Apple home-screen icon and Android's maskable icon still get a solid background, because those require one.
                        </p>
                      )}
                    </div>
                    {(!transparent || (darkOn && !darkTransparent)) && (
                      <div className="space-y-2">
                        <span className="block text-sm font-medium">Shape</span>
                        <fieldset className="flex flex-wrap gap-1.5">
                          <legend className="sr-only">Shape</legend>
                          {(['square', 'rounded', 'circle'] as FaviconShape[]).map((s) => (
                            <Chip key={s} active={shape === s} onClick={() => setShape(s)}>{s[0].toUpperCase() + s.slice(1)}</Chip>
                          ))}
                        </fieldset>
                        {transparent && <p className="text-xs text-muted-foreground">Used by the dark-mode icon, which has a background.</p>}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Padding</span>
                        <span className="font-mono tabular-nums text-muted-foreground">{Math.round(padding * 100)}%</span>
                      </div>
                      <Slider value={[Math.round(padding * 100)]} min={0} max={35} step={1} onValueChange={(v) => setPadding(v[0] / 100)} aria-label="Padding" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                    <CardTitle className="flex items-center gap-2 font-headline text-lg">
                      <Moon className="h-4 w-4" /> Dark mode version
                    </CardTitle>
                    <Switch checked={darkOn} onCheckedChange={setDarkOn} aria-label="Make a dark mode version" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!darkOn ? (
                      <p className="text-sm text-muted-foreground">
                        Give dark browser tabs their own icon, so it doesn&apos;t vanish against a dark tab bar.
                      </p>
                    ) : (
                      <>
                        {kind === 'image' && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <Button variant="outline" size="sm" onClick={() => darkFileRef.current?.click()}>
                                <Upload className="h-4 w-4" /> {darkImage ? 'Choose another dark image' : 'Use a different image in dark mode'}
                              </Button>
                              {darkImage && (
                                <Button variant="ghost" size="sm" onClick={() => setDarkImage(null)}>
                                  Use the same image
                                </Button>
                              )}
                            </div>
                            <input ref={darkFileRef} type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { void loadDarkImage(e.target.files?.[0]); e.target.value = '' }} />
                            <p className="text-xs text-muted-foreground">
                              {darkImage ? `Dark mode uses ${darkImage.name}.` : 'Handy when a dark logo would disappear on a dark tab bar: upload a light version.'}
                            </p>
                          </div>
                        )}
                        {kind === 'text' && (
                          <div className="space-y-2">
                            <span className="block text-sm font-medium">Text colour</span>
                            <ColorPicker value={darkTextColor} onChange={setDarkTextColor} className="h-8 w-8" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <span className="block text-sm font-medium">Background</span>
                          <div className="flex flex-wrap items-center gap-3">
                            <fieldset className="flex flex-wrap gap-1.5">
                              <legend className="sr-only">Dark mode background</legend>
                              <Chip active={!darkTransparent} onClick={() => setDarkTransparent(false)}>Colour</Chip>
                              <Chip active={darkTransparent} onClick={() => setDarkTransparent(true)}>None</Chip>
                            </fieldset>
                            {!darkTransparent && <ColorPicker value={darkBg} onChange={setDarkBg} className="h-8 w-8" />}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Browsers switch to this version in tab bars when the system is in dark mode. Home-screen icons on iPhone and Android
                          use the main version.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">App details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="fav-name">Name</Label>
                      <Input id="fav-name" value={appName} onChange={(e) => setAppName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fav-short">Short name</Label>
                      <Input id="fav-short" value={shortName} maxLength={12} onChange={(e) => setShortName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium">Theme colour</span>
                      <div className="flex items-center gap-2">
                        <ColorPicker value={themeColor} onChange={setThemeColor} className="h-8 w-8" />
                        <span className="font-mono text-sm text-muted-foreground">{themeColor}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-3">
                      Used in the web app manifest: the name under the icon on phones, and the colour of the browser bar on Android.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6 lg:sticky lg:top-20">
                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {previews[16] ? (
                      <>
                        <div className="space-y-2">
                          <BrowserTab icon={previews[32]} title={appName} />
                          <BrowserTab icon={previews.dark32 ?? previews[32]} title={appName} dark />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <figure className="flex flex-col items-center gap-2 rounded-md bg-[linear-gradient(135deg,#3b5bdb,#9c36b5)] p-4">
                            <img src={previews.apple} alt="" className="h-16 w-16 rounded-[22%] shadow-md" />
                            <figcaption className="max-w-full truncate text-xs text-white">{shortName || appName}</figcaption>
                          </figure>
                          <figure className="flex flex-col items-center gap-2 rounded-md bg-[linear-gradient(135deg,#0b7285,#2b8a3e)] p-4">
                            <img src={previews.maskable} alt="" className="h-16 w-16 rounded-full shadow-md" />
                            <figcaption className="max-w-full truncate text-xs text-white">{shortName || appName}</figcaption>
                          </figure>
                        </div>
                        <p className="-mt-2 grid grid-cols-2 gap-4 text-center text-[11px] text-muted-foreground">
                          <span>iPhone home screen</span>
                          <span>Android (adaptive)</span>
                        </p>
                        <div className="flex flex-wrap items-end gap-3 rounded-md bg-[conic-gradient(var(--muted)_25%,transparent_0_50%,var(--muted)_0_75%,transparent_0)] bg-[length:12px_12px] p-3">
                          {PREVIEW_SIZES.slice(0, 4).map((s) => (
                            <figure key={s} className="flex flex-col items-center gap-1">
                              <img src={previews[s]} alt="" width={Math.min(s, 64)} height={Math.min(s, 64)} style={{ imageRendering: s <= 32 ? 'pixelated' : 'auto' }} />
                              <figcaption className="text-[10px] text-muted-foreground tabular-nums">{s}px</figcaption>
                            </figure>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{kind === 'image' ? 'Choose an image to see your icons.' : 'Type something to see your icons.'}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Download</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button onClick={() => void downloadPackage()} disabled={!source || building} className="h-11">
                        <Archive className="h-4 w-4" /> Everything (ZIP)
                      </Button>
                      <Button variant="outline" onClick={() => void downloadIco()} disabled={!source} className="h-11">
                        <Download className="h-4 w-4" /> favicon.ico only
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The ZIP has favicon.ico (16, 32, 48 px), PNGs for browsers, an Apple touch icon, Android icons (including a maskable one),
                      {darkSource ? ' dark-mode PNGs,' : ''}{svgAvailable ? ` a favicon.svg${darkOn ? ' that follows the theme' : ''}${source?.kind === 'text' && fontId !== 'system' ? ' (your font is drawn into it, because favicons cannot load web fonts)' : ''},` : ''} and site.webmanifest.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Add this to your &lt;head&gt;</span>
                        <CopyButton value={() => snippet} label="Copy" size="sm" toastDescription="HTML snippet copied." />
                      </div>
                      <pre className="overflow-x-auto rounded-md border border-border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">{snippet}</pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <ToolMethodology />
      </SidebarInset>
    </>
  )
}

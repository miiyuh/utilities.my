"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Upload, 
  Download, 
  RotateCcw, 
  Image as ImageIcon, 
  FileImage, 
  Loader2, 
  CheckCircle2 as CheckCircle, 
  AlertCircle,
  Info,
  Trash2,
  RefreshCw,
  Palette,
  Settings2
} from 'lucide-react'

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [filename, setFilename] = useState<string>('')
  const [size, setSize] = useState<number>(0)
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null)
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null)

  const [format, setFormat] = useState<OutputFormat>('image/png')
  const [width, setWidth] = useState<number | ''>('')
  const [height, setHeight] = useState<number | ''>('')
  const [lockAspect, setLockAspect] = useState(true)
  const [quality, setQuality] = useState<number>(0.9)

  const [processing, setProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const aspectRatioRef = useRef<number | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)

  const handleFile = useCallback((f: File) => {
    if (!f) return
    
    // Validate file type
    if (!f.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, GIF, BMP)')
      return
    }
    
    // Validate file size (max 50MB)
    if (f.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }
    
    const url = URL.createObjectURL(f)
    setFile(f)
    setImgSrc(url)
    setFilename(f.name)
    setSize(f.size)
    setDownloadUrl(null)
    setPreviewUrl(null)
    setMessage(null)
    setError(null)
    setImageLoaded(false)
  }, [])

  useEffect(() => {
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc)
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [imgSrc, downloadUrl, previewUrl])

  const onPreviewLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget
    setNaturalWidth(el.naturalWidth)
    setNaturalHeight(el.naturalHeight)
    aspectRatioRef.current = el.naturalWidth / el.naturalHeight
    if (width === '') setWidth(el.naturalWidth)
    if (height === '') setHeight(el.naturalHeight)
    setImageLoaded(true)
    // Note: Preview will be generated automatically via useEffect, no need to call here
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (f) handleFile(f)
    e.currentTarget.value = ''
  }

  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const prevent = (ev: DragEvent) => { ev.preventDefault(); ev.stopPropagation() }

    const onDrop = (ev: DragEvent) => {
      prevent(ev)
      const f = ev.dataTransfer?.files?.[0] ?? null
      if (f) handleFile(f)
      setIsDragOver(false)
    }
    const onDragOver = (ev: DragEvent) => { 
      prevent(ev)
      setIsDragOver(true)
    }
    const onDragLeave = (ev: DragEvent) => {
      prevent(ev)
      // Only set drag over to false if we're leaving the drop zone itself
      if (!el.contains(ev.relatedTarget as Node)) {
        setIsDragOver(false)
      }
    }

    el.addEventListener('dragover', onDragOver)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('drop', onDrop)
    el.addEventListener('dragenter', prevent)

    return () => {
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('dragleave', onDragLeave)
      el.removeEventListener('drop', onDrop)
      el.removeEventListener('dragenter', prevent)
    }
  }, [handleFile])

  useEffect(() => {
    if (!lockAspect || !aspectRatioRef.current) return
    if (naturalWidth && naturalHeight) {
      if (width !== '' && height === '') {
        setHeight(Math.round(Number(width) / aspectRatioRef.current))
      } else if (height !== '' && width === '') {
        setWidth(Math.round(Number(height) * aspectRatioRef.current))
      } else if (width !== '' && height !== '') {
        setHeight(Math.round(Number(width) / aspectRatioRef.current))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, lockAspect, naturalWidth, naturalHeight])

  const convert = async () => {
    if (!imgSrc || !file) {
      setError('Please upload an image first')
      return
    }
    
    if (!imageLoaded || !naturalWidth || !naturalHeight) {
      setError('Image is still loading. Please wait a moment and try again.')
      return
    }
    
    setProcessing(true)
    setMessage(null)
    setError(null)
    
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image()
        i.onload = () => res(i)
        i.onerror = () => rej(new Error('Failed to load image'))
        i.src = imgSrc
      })

      const targetW = width === '' ? img.naturalWidth : Number(width)
      const targetH = height === '' ? img.naturalHeight : Number(height)

      // Validate dimensions
      if (targetW <= 0 || targetH <= 0) {
        throw new Error('Invalid dimensions. Width and height must be greater than 0.')
      }
      
      if (targetW > 8000 || targetH > 8000) {
        throw new Error('Dimensions too large. Maximum width/height is 8000px.')
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(targetW))
      canvas.height = Math.max(1, Math.floor(targetH))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const mime = format
      const blob: Blob | null = await new Promise(resolve =>
        canvas.toBlob(
          b => resolve(b),
          mime,
          mime === 'image/jpeg' || mime === 'image/webp' ? quality : undefined
        )
      )

      if (!blob) throw new Error('Failed to create output')

      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
      const outUrl = URL.createObjectURL(blob)
      setDownloadUrl(outUrl)
      setMessage(`Conversion complete! File size: ${humanSize(blob.size)}`)
    } catch (e) {
      console.error(e)
      const errorMessage = e instanceof Error ? e.message : 'Conversion failed. Please try again.'
      setError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const clear = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc)
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setImgSrc(null)
    setFilename('')
    setSize(0)
    setNaturalWidth(null)
    setNaturalHeight(null)
    setWidth('')
    setHeight('')
    setDownloadUrl(null)
    setPreviewUrl(null)
    setMessage(null)
    setError(null)
    setIsDragOver(false)
    setImageLoaded(false)
  }

  // Generate live preview based on current settings
  const generatePreview = useCallback(async () => {
    if (!imgSrc || !imageLoaded) {
      setPreviewUrl(null)
      return
    }

    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image()
        i.onload = () => res(i)
        i.onerror = () => rej(new Error('Failed to load image'))
        i.src = imgSrc
      })

      const targetW = width === '' ? img.naturalWidth : Number(width)
      const targetH = height === '' ? img.naturalHeight : Number(height)

      // Skip if invalid dimensions
      if (targetW <= 0 || targetH <= 0 || targetW > 8000 || targetH > 8000) {
        setPreviewUrl(null)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(targetW))
      canvas.height = Math.max(1, Math.floor(targetH))
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const mime = format
      const blob: Blob | null = await new Promise(resolve =>
        canvas.toBlob(
          b => resolve(b),
          mime,
          mime === 'image/jpeg' || mime === 'image/webp' ? quality : undefined
        )
      )

      if (!blob) return

      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const newPreviewUrl = URL.createObjectURL(blob)
      setPreviewUrl(newPreviewUrl)
    } catch (e) {
      console.error('Preview generation error:', e)
      setPreviewUrl(null)
    }
  }, [imgSrc, format, width, height, quality, imageLoaded])

  // Generate preview when settings change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generatePreview()
    }, 300) // Debounce to avoid too many calls

    return () => clearTimeout(timeoutId)
  }, [generatePreview])

  const humanSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h1 className="text-lg sm:text-xl font-semibold font-headline truncate">Image Converter</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>

        <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {/* Big heading */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground border-b border-border pb-3 sm:pb-4">Image Converter & Resizer</h1>
              <p className="text-base sm:text-lg text-muted-foreground">Convert images between formats, resize, and download the result.</p>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              {/* Compact Upload Area */}
              <Card className="minimal-card">
                <CardContent className="p-4 sm:p-6">
                  <div
                    ref={dropRef}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        const inp = document.getElementById('file-input') as HTMLInputElement | null
                        inp?.click()
                      }
                    }}
                    className={`
                      relative border-2 border-dashed rounded-lg p-4 sm:p-6 flex items-center justify-center text-center transition-all duration-200 cursor-pointer
                      ${isDragOver 
                        ? 'border-primary bg-primary/5 scale-[1.01]' 
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
                      }
                      ${!imgSrc ? 'min-h-[100px] sm:min-h-[100px]' : ''}
                      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    `}
                    aria-label="Drop image here or click to upload"
                    onClick={() => {
                      const inp = document.getElementById('file-input') as HTMLInputElement | null
                      inp?.click()
                    }}
                  >
                    {!imgSrc ? (
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isDragOver ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Upload className="h-6 w-6" />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                          <div className="font-medium text-foreground mb-1">
                            {isDragOver ? 'Drop your image here' : 'Drag & drop an image here'}
                          </div>
                          <div className="text-sm text-muted-foreground">or click to choose file • PNG, JPG, WebP, GIF, BMP • Max 50MB</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
                        <div className="relative flex-shrink-0">
                          <img
                            src={imgSrc}
                            alt="preview"
                            className="w-16 h-16 object-contain rounded-lg border border-border bg-background shadow-sm"
                          />
                          <div className="absolute -top-1 -right-1">
                            <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-md text-xs px-1.5 py-0.5">
                              <CheckCircle className="h-2.5 w-2.5" />
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <div className="font-medium text-foreground truncate" title={filename}>{filename}</div>
                          <div className="text-sm text-muted-foreground">
                            {humanSize(size)} • {imageLoaded && naturalWidth && naturalHeight ? `${naturalWidth}×${naturalHeight}px` : (
                              <span className="inline-flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Loading dimensions...
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              const inp = document.getElementById('file-input') as HTMLInputElement | null
                              inp?.click()
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Change
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              clear()
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                    <input 
                      id="file-input" 
                      type="file" 
                      accept="image/*" 
                      onChange={onInputChange} 
                      className="sr-only" 
                    />
                    {/* Hidden image for loading original dimensions */}
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt=""
                        onLoad={onPreviewLoad}
                        className="sr-only"
                      />
                    )}
                  </div>
                  
                  {/* Error Display */}
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 mt-4">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-destructive text-sm mb-1">Upload Error</div>
                        <div className="text-sm text-destructive/80 leading-snug">{error}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Main Card: Conversion Settings & Live Preview */}
              <Card className="minimal-card">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="font-headline text-lg sm:text-xl md:text-2xl tracking-tight flex items-center gap-2">
                    <Settings2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="truncate">Conversion Settings & Live Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Left: Settings */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                          Output Settings
                        </h3>
                        
                        {/* Format Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="format" className="text-sm font-medium">Output Format</Label>
                          <Select value={format} onValueChange={(value: OutputFormat) => setFormat(value)}>
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image/png">
                                <div className="flex items-center gap-2">
                                  <Palette className="h-4 w-4" />
                                  <span className="hidden sm:inline">PNG - Lossless</span>
                                  <span className="sm:hidden">PNG</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="image/jpeg">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="h-4 w-4" />
                                  <span className="hidden sm:inline">JPG - Compressed</span>
                                  <span className="sm:hidden">JPG</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="image/webp">
                                <div className="flex items-center gap-2">
                                  <FileImage className="h-4 w-4" />
                                  <span className="hidden sm:inline">WebP - Modern</span>
                                  <span className="sm:hidden">WebP</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Dimensions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="width" className="text-sm font-medium">Width (px)</Label>
                            <Input
                              id="width"
                              type="number"
                              min={1}
                              max={8000}
                              value={width === '' ? '' : String(width)}
                              onChange={e => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                              disabled={!imgSrc}
                              placeholder="Auto"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="height" className="text-sm font-medium">Height (px)</Label>
                            <Input
                              id="height"
                              type="number"
                              min={1}
                              max={8000}
                              value={height === '' ? '' : String(height)}
                              onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                              disabled={!imgSrc}
                              placeholder="Auto"
                              className="h-10"
                            />
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="aspect-ratio"
                              checked={lockAspect}
                              onCheckedChange={setLockAspect}
                            />
                            <Label htmlFor="aspect-ratio" className="text-sm font-medium cursor-pointer flex-1">
                              Keep aspect ratio
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>When enabled, changing width or height will automatically adjust the other dimension to maintain the original image proportions.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {(format === 'image/jpeg' || format === 'image/webp') && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-muted-foreground">Quality</Label>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(quality * 100)}%
                                </Badge>
                              </div>
                              <Slider
                                value={[quality]}
                                onValueChange={([value]) => setQuality(value)}
                                min={0.1}
                                max={1}
                                step={0.05}
                                disabled={!imgSrc}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Output Information */}
                      {imgSrc && (
                        <div className="space-y-3 sm:space-y-4">
                          <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                            <FileImage className="h-4 w-4 sm:h-5 sm:w-5" />
                            Output Information
                          </h3>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="p-2 sm:p-3 bg-muted/20 rounded-lg text-center">
                              <div className="text-xs text-muted-foreground mb-1">Format</div>
                              <div className="font-medium text-xs sm:text-sm">{format.split('/')[1].toUpperCase()}</div>
                            </div>
                            {width !== '' && height !== '' && (
                              <div className="p-2 sm:p-3 bg-muted/20 rounded-lg text-center">
                                <div className="text-xs text-muted-foreground mb-1">Output Size</div>
                                <div className="font-medium text-xs sm:text-sm">{width}×{height}px</div>
                              </div>
                            )}
                            {naturalWidth && naturalHeight && (
                              <>
                                <div className="p-2 sm:p-3 bg-muted/20 rounded-lg text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Original</div>
                                  <div className="font-medium text-xs sm:text-sm">{naturalWidth}×{naturalHeight}px</div>
                                </div>
                                {width !== '' && height !== '' && (
                                  <div className="p-2 sm:p-3 bg-muted/20 rounded-lg text-center">
                                    <div className="text-xs text-muted-foreground mb-1">Scale</div>
                                    <div className="font-medium text-xs sm:text-sm">
                                      {((Number(width) / naturalWidth) * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Live Preview */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
                        <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                        Live Preview
                      </div>
                      <div className="bg-muted/30 border border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                        {imgSrc ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt="Live Preview"
                                className="max-w-full max-h-[280px] sm:max-h-[380px] object-contain rounded-lg shadow-lg border border-border/50"
                                style={{ imageRendering: 'crisp-edges' }}
                              />
                            ) : (
                              <div className="text-center space-y-3 sm:space-y-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-spin" />
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">Generating preview...</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center space-y-3 sm:space-y-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                            </div>
                            <div className="text-sm sm:text-base text-muted-foreground font-medium">Upload an image to see live preview</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                    {/* Action Buttons - More Prominent */}
                    <div className="border-t pt-4 sm:pt-6">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <Button
                          onClick={convert}
                          disabled={!imgSrc || !imageLoaded || processing}
                          size="lg"
                          className="w-full h-12 text-base font-medium"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Converting...
                            </>
                          ) : !imageLoaded && imgSrc ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Loading Image...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-5 w-5 mr-2" />
                              Convert & Download
                            </>
                          )}
                        </Button>

                        <div className="flex flex-col sm:flex-row gap-3">
                          {downloadUrl && (
                            <Button
                              asChild
                              variant="outline"
                              size="lg"
                              className="flex-1 h-12 text-base font-medium border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                            >
                              <a
                                href={downloadUrl}
                                download={`${filename ? filename.replace(/\.[^/.]+$/, '') : 'converted'}.${format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp'}`}
                              >
                                <Download className="h-5 w-5 mr-2" />
                                Download Result
                              </a>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            onClick={clear}
                            disabled={processing}
                            size="lg"
                            className={`h-12 ${downloadUrl ? 'flex-initial' : 'w-full'}`}
                          >
                            <RotateCcw className="h-5 w-5 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {processing && (
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing your image...
                        </div>
                        <Progress value={undefined} className="h-2" />
                      </div>
                    )}
                    
                    {message && (
                      <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="text-sm text-green-800 dark:text-green-200 leading-snug">{message}</div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-destructive leading-snug">{error}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </TooltipProvider>
  )
}

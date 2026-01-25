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
  Settings2,
  Layers,
  X,
  Play,
  Archive
} from 'lucide-react'

import {
  type OutputFormat,
  type BatchFileItem,
  type ConversionSettings,
  generateFileId,
  validateImageFile,
  processBatchQueue,
  createBatchZip,
  downloadBlob,
  isIOSOrSafari,
  humanSize,
  getConvertedFilename
} from '@/lib/image-utils'

export default function ImageConverterPage() {
  // Mode toggle: single or batch
  const [batchMode, setBatchMode] = useState(false)
  
  // Single mode state
  const [file, setFile] = useState<File | null>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [filename, setFilename] = useState<string>('')
  const [size, setSize] = useState<number>(0)
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null)
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null)

  // Shared conversion settings
  const [format, setFormat] = useState<OutputFormat>('image/png')
  const [width, setWidth] = useState<number | ''>('')
  const [height, setHeight] = useState<number | ''>('')
  const [lockAspect, setLockAspect] = useState(true)
  const [quality, setQuality] = useState<number>(0.9)

  // Single mode processing state
  const [processing, setProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [generatingPreview, setGeneratingPreview] = useState(false)
  const [downloadBlobState, setDownloadBlobState] = useState<Blob | null>(null)

  // Batch mode state
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([])
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [batchZipBlob, setBatchZipBlob] = useState<Blob | null>(null)
  const [batchError, setBatchError] = useState<string | null>(null)
  const batchAbortRef = useRef(false)

  const aspectRatioRef = useRef<number | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)
  const isGeneratingRef = useRef(false)
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentPreviewUrlRef = useRef<string | null>(null)

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
    
    // Clean up previous URLs
    if (imgSrc) URL.revokeObjectURL(imgSrc)
    if (downloadUrl && downloadUrl.startsWith('blob:')) URL.revokeObjectURL(downloadUrl)
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    
    // Use FileReader for better mobile compatibility
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        setFile(f)
        setImgSrc(dataUrl)
        setFilename(f.name)
        setSize(f.size)
        setDownloadUrl(null)
        setPreviewUrl(null)
        setMessage(null)
        setError(null)
        setImageLoaded(false)
      }
    }
    
    reader.onerror = () => {
      setError('Failed to load image. The file may be corrupted or in an unsupported format. Please try a different image.')
    }
    
    // Read the file as data URL (base64)
    try {
      reader.readAsDataURL(f)
    } catch (err) {
      console.error('FileReader error:', err)
      setError('Failed to read the image file. Please try again.')
    }
  }, [imgSrc, downloadUrl, previewUrl])

  // Handle batch file upload
  const handleBatchFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: BatchFileItem[] = []
    const errors: string[] = []
    
    // Check current count
    const remainingSlots = 20 - batchFiles.length
    if (remainingSlots <= 0) {
      setBatchError('Maximum 20 files allowed. Remove some files first.')
      return
    }
    
    const filesToProcess = fileArray.slice(0, remainingSlots)
    
    for (const f of filesToProcess) {
      const validation = validateImageFile(f)
      if (validation.valid) {
        validFiles.push({
          id: generateFileId(),
          file: f,
          status: 'queued',
          progress: 0,
          originalName: f.name
        })
      } else {
        errors.push(`${f.name}: ${validation.error}`)
      }
    }
    
    if (validFiles.length > 0) {
      setBatchFiles(prev => [...prev, ...validFiles])
      setBatchZipBlob(null) // Clear previous ZIP
    }
    
    if (errors.length > 0) {
      setBatchError(`Some files were skipped:\n${errors.join('\n')}`)
    } else {
      setBatchError(null)
    }
    
    if (fileArray.length > remainingSlots) {
      setBatchError(`Only ${remainingSlots} file(s) added. Maximum 20 files allowed.`)
    }
  }, [batchFiles.length])

  useEffect(() => {
    return () => {
      // Clean up blob URLs (downloadUrl and previewUrl are still blob URLs)
      if (downloadUrl && downloadUrl.startsWith('blob:')) URL.revokeObjectURL(downloadUrl)
      if (currentPreviewUrlRef.current && currentPreviewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrlRef.current)
      }
    }
  }, [downloadUrl])

  const onPreviewLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget
    if (!el.naturalWidth || !el.naturalHeight) {
      setError('Failed to load image dimensions. Please try a different image.')
      return
    }
    setNaturalWidth(el.naturalWidth)
    setNaturalHeight(el.naturalHeight)
    aspectRatioRef.current = el.naturalWidth / el.naturalHeight
    if (width === '') setWidth(el.naturalWidth)
    if (height === '') setHeight(el.naturalHeight)
    setImageLoaded(true)
    // Note: Preview will be generated automatically via useEffect, no need to call here
  }

  const onPreviewError = () => {
    setError('Failed to load image. Please try uploading a different image or check the file format.')
    setImageLoaded(false)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (batchMode) {
      const files = e.target.files
      if (files && files.length > 0) {
        handleBatchFiles(files)
      }
    } else {
      const f = e.target.files?.[0] ?? null
      if (f) handleFile(f)
    }
    e.currentTarget.value = ''
  }

  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const prevent = (ev: DragEvent) => { ev.preventDefault(); ev.stopPropagation() }

    const onDrop = (ev: DragEvent) => {
      prevent(ev)
      if (batchMode) {
        const files = ev.dataTransfer?.files
        if (files && files.length > 0) {
          handleBatchFiles(files)
        }
      } else {
        const f = ev.dataTransfer?.files?.[0] ?? null
        if (f) handleFile(f)
      }
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
  }, [handleFile, handleBatchFiles, batchMode])

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

      if (downloadUrl && downloadUrl.startsWith('blob:')) URL.revokeObjectURL(downloadUrl)
      const outUrl = URL.createObjectURL(blob)
      setDownloadUrl(outUrl)
      setDownloadBlobState(blob)
      
      // Auto-download the file
      const fileName = `${filename ? filename.replace(/\.[^/.]+$/, '') : 'converted'}.${format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp'}`
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(typeof window !== 'undefined' && 'MSStream' in window)
      const isSafari = /^((?!chrome|android))*safari/i.test(navigator.userAgent)
      
      if (isIOS || isSafari) {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        reader.readAsDataURL(blob)
      } else {
        const link = document.createElement('a')
        link.href = outUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      setMessage(`✓ Conversion complete! Downloaded: ${fileName} (${humanSize(blob.size)})`)
    } catch (e) {
      console.error(e)
      const errorMessage = e instanceof Error ? e.message : 'Conversion failed. Please try again.'
      setError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  // Mobile-friendly download function
  const handleDownload = () => {
    if (!downloadBlobState) return

    const fileName = `${filename ? filename.replace(/\.[^/.]+$/, '') : 'converted'}.${format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp'}`
    
    downloadBlob(downloadBlobState, fileName, isIOSOrSafari())
  }

  const clear = () => {
    // Clean up blob URLs only
    if (downloadUrl && downloadUrl.startsWith('blob:')) URL.revokeObjectURL(downloadUrl)
    if (currentPreviewUrlRef.current && currentPreviewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreviewUrlRef.current)
    }
    setFile(null)
    setImgSrc(null)
    setFilename('')
    setSize(0)
    setNaturalWidth(null)
    setNaturalHeight(null)
    setWidth('')
    setHeight('')
    setDownloadUrl(null)
    setDownloadBlobState(null)
    setPreviewUrl(null)
    currentPreviewUrlRef.current = null
    setMessage(null)
    setError(null)
    setIsDragOver(false)
    setImageLoaded(false)
    setGeneratingPreview(false)
  }

  // Clear batch files
  const clearBatch = () => {
    setBatchFiles([])
    setBatchZipBlob(null)
    setBatchError(null)
    setBatchProgress({ current: 0, total: 0 })
    batchAbortRef.current = false
  }

  // Remove a single file from batch queue
  const removeBatchFile = (id: string) => {
    setBatchFiles(prev => prev.filter(f => f.id !== id))
    setBatchZipBlob(null)
  }

  // Process batch files
  const processBatch = async () => {
    if (batchFiles.length === 0) {
      setBatchError('No files to process')
      return
    }

    setBatchProcessing(true)
    setBatchError(null)
    setBatchZipBlob(null)
    batchAbortRef.current = false
    
    const settings: ConversionSettings = {
      format,
      width,
      height,
      quality
    }

    // Reset all files to queued
    const resetFiles = batchFiles.map(f => ({
      ...f,
      status: 'queued' as const,
      progress: 0,
      error: undefined,
      convertedBlob: undefined
    }))
    setBatchFiles(resetFiles)
    setBatchProgress({ current: 0, total: resetFiles.length })

    let finalItems: BatchFileItem[] = resetFiles

    try {
      const generator = processBatchQueue(resetFiles, settings)
      
      for await (const progress of generator) {
        if (batchAbortRef.current) {
          break
        }
        
        finalItems = [...progress.items]
        setBatchFiles(finalItems)
        setBatchProgress({
          current: progress.items.filter(i => i.status === 'completed' || i.status === 'error').length,
          total: progress.totalFiles
        })
      }

      // Check how many completed successfully
      const completedCount = finalItems.filter(f => f.status === 'completed').length
      const errorCount = finalItems.filter(f => f.status === 'error').length
      
      if (batchAbortRef.current) {
        setBatchError('Batch processing was cancelled')
      } else if (completedCount === 0) {
        setBatchError('All files failed to convert')
      } else if (errorCount > 0) {
        setBatchError(`${completedCount} of ${finalItems.length} files converted. ${errorCount} failed.`)
      }

      // Create ZIP if any files completed
      if (completedCount > 0 && !batchAbortRef.current) {
        try {
          const zipBlob = await createBatchZip(finalItems, format)
          setBatchZipBlob(zipBlob)
          
          // Auto-download the ZIP
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
          const zipFilename = `batch-converted-${timestamp}.zip`
          downloadBlob(zipBlob, zipFilename, isIOSOrSafari())
        } catch (zipError) {
          console.error('ZIP creation error:', zipError)
          setBatchError('Failed to create ZIP file. Try downloading individual files.')
        }
      }
    } catch (e) {
      console.error('Batch processing error:', e)
      setBatchError(e instanceof Error ? e.message : 'Batch processing failed')
    } finally {
      setBatchProcessing(false)
    }
  }

  // Cancel batch processing
  const cancelBatch = () => {
    batchAbortRef.current = true
  }

  // Download batch ZIP
  const handleBatchDownload = () => {
    if (!batchZipBlob) return
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const zipFilename = `batch-converted-${timestamp}.zip`
    downloadBlob(batchZipBlob, zipFilename, isIOSOrSafari())
  }

  // Reprocess a single failed file
  const reprocessFile = async (id: string) => {
    const fileItem = batchFiles.find(f => f.id === id)
    if (!fileItem) return
    
    // Update status to processing
    setBatchFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'processing' as const, progress: 0, error: undefined } : f
    ))
    
    const settings: ConversionSettings = {
      format,
      width,
      height,
      quality
    }
    
    try {
      const singleFileItems = [{ ...fileItem, status: 'queued' as const, progress: 0, error: undefined }]
      const generator = processBatchQueue(singleFileItems, settings)
      
      for await (const progress of generator) {
        const updatedFile = progress.items[0]
        setBatchFiles(prev => prev.map(f => 
          f.id === id ? updatedFile : f
        ))
      }
      
      // Clear ZIP since we've reprocessed
      setBatchZipBlob(null)
    } catch (e) {
      console.error('Reprocess error:', e)
      setBatchFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'error' as const, error: 'Reprocessing failed' } : f
      ))
    }
  }

  // Generate live preview based on current settings (only in single mode)
  const generatePreview = useCallback(async () => {
    if (!imgSrc || !imageLoaded) {
      setPreviewUrl(null)
      setGeneratingPreview(false)
      isGeneratingRef.current = false
      return
    }

    // Prevent multiple simultaneous generations
    if (isGeneratingRef.current) {
      return
    }

    isGeneratingRef.current = true
    setGeneratingPreview(true)
    
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image()
        const timeout = setTimeout(() => rej(new Error('Image load timeout')), 10000)
        i.onload = () => {
          clearTimeout(timeout)
          res(i)
        }
        i.onerror = () => {
          clearTimeout(timeout)
          rej(new Error('Failed to load image'))
        }
        i.src = imgSrc
      })

      const targetW = width === '' ? img.naturalWidth : Number(width)
      const targetH = height === '' ? img.naturalHeight : Number(height)

      // Skip if invalid dimensions
      if (targetW <= 0 || targetH <= 0 || targetW > 8000 || targetH > 8000) {
        setPreviewUrl(null)
        setGeneratingPreview(false)
        isGeneratingRef.current = false
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(targetW))
      canvas.height = Math.max(1, Math.floor(targetH))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setGeneratingPreview(false)
        isGeneratingRef.current = false
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const mime = format
      // Add timeout to toBlob for mobile compatibility
      const blob: Blob | null = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('toBlob timeout, falling back to dataURL method')
          reject(new Error('Blob conversion timeout'))
        }, 5000) // 5 second timeout
        
        canvas.toBlob(
          b => {
            clearTimeout(timeout)
            resolve(b)
          },
          mime,
          mime === 'image/jpeg' || mime === 'image/webp' ? quality : undefined
        )
      })

      if (!blob) {
        console.warn('toBlob returned null')
        setGeneratingPreview(false)
        isGeneratingRef.current = false
        return
      }

      // Clean up old preview URL before creating new one
      if (currentPreviewUrlRef.current && currentPreviewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrlRef.current)
      }
      const newPreviewUrl = URL.createObjectURL(blob)
      currentPreviewUrlRef.current = newPreviewUrl
      setPreviewUrl(newPreviewUrl)
      setGeneratingPreview(false)
      isGeneratingRef.current = false
    } catch (e) {
      console.error('Preview generation error:', e)
      // On error, try to use original image as fallback
      if (imgSrc && currentPreviewUrlRef.current !== imgSrc) {
        setPreviewUrl(imgSrc)
        currentPreviewUrlRef.current = imgSrc
      }
      setGeneratingPreview(false)
      isGeneratingRef.current = false
    }
  }, [imgSrc, format, width, height, quality, imageLoaded])

  // Generate preview when settings change (only in single mode)
  useEffect(() => {
    // Skip preview generation in batch mode
    if (batchMode) {
      return
    }
    
    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
    
    // Debounce preview generation to prevent flashing
    previewTimeoutRef.current = setTimeout(() => {
      generatePreview()
    }, 500) // Increased debounce to 500ms for smoother experience

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [generatePreview, batchMode])

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

            {/* Mode Toggle */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <span className={`text-sm font-medium ${!batchMode ? 'text-foreground' : 'text-muted-foreground'}`}>Single</span>
                </div>
                <Switch
                  checked={batchMode}
                  onCheckedChange={(checked) => {
                    setBatchMode(checked)
                    // Clear state when switching modes
                    if (checked) {
                      clear()
                    } else {
                      clearBatch()
                    }
                  }}
                  disabled={processing || batchProcessing}
                />
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                  <span className={`text-sm font-medium ${batchMode ? 'text-foreground' : 'text-muted-foreground'}`}>Batch (Max 20)</span>
                </div>
                {batchMode && batchFiles.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {batchFiles.length}/20 files
                  </Badge>
                )}
              </div>
            </div>
            
            <div className={`${batchMode ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8' : 'space-y-6 sm:space-y-8'}`}>
              {/* Left Column / Single: Upload Area & File List */}
              <div>
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
                        : 'border-muted-foreground/25'
                      }
                      ${!(batchMode && batchFiles.length > 0) && 'hover:border-primary/50 hover:bg-accent/50'}
                      min-h-[100px] sm:min-h-[100px]
                      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    `}
                    aria-label={batchMode ? "Drop images here or click to upload (max 20)" : "Drop image here or click to upload"}
                    onClick={() => {
                      const inp = document.getElementById('file-input') as HTMLInputElement | null
                      inp?.click()
                      // Remove focus outline after click
                      if (dropRef.current) {
                        dropRef.current.blur()
                      }
                    }}
                  >
                    {/* Single Mode Upload Content */}
                    {!batchMode && !imgSrc && (
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
                    )}
                    
                    {/* Batch Mode Upload Content */}
                    {batchMode && batchFiles.length === 0 && (
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isDragOver ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Layers className="h-6 w-6" />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                          <div className="font-medium text-foreground mb-1">
                            {isDragOver ? 'Drop your images here' : 'Drag & drop images here (max 20)'}
                          </div>
                          <div className="text-sm text-muted-foreground">or click to choose files • PNG, JPG, WebP, GIF, BMP • Max 50MB each</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Batch Mode: Files Added */}
                    {batchMode && batchFiles.length > 0 && (
                      <div className="w-full text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b">
                          <Badge variant="secondary" className="text-sm">
                            <Layers className="h-3.5 w-3.5 mr-1" />
                            {batchFiles.length}/20 files
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (batchFiles.length < 20) {
                                const inp = document.getElementById('file-input') as HTMLInputElement | null
                                inp?.click()
                                // Remove focus outline
                                ;(e.target as HTMLButtonElement).blur()
                              }
                            }}
                            disabled={batchFiles.length >= 20}
                          >
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            {batchFiles.length >= 20 ? 'Max Files Reached' : 'Add More'}
                          </Button>
                        </div>
                        <div 
                          className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
                          onWheel={() => {
                            if (document.activeElement instanceof HTMLElement) {
                              document.activeElement.blur()
                            }
                          }}
                        >
                          {batchFiles.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-2 bg-background/50 rounded-lg border border-border/50"
                            >
                              <div className="flex-shrink-0">
                                {item.status === 'queued' && (
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                    <FileImage className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                )}
                                {item.status === 'processing' && (
                                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                                  </div>
                                )}
                                {item.status === 'completed' && (
                                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  </div>
                                )}
                                {item.status === 'error' && (
                                  <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate" title={item.originalName}>
                                  {item.originalName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.status === 'queued' && humanSize(item.file.size)}
                                  {item.status === 'processing' && `Processing... ${item.progress}%`}
                                  {item.status === 'completed' && (
                                    <span className="text-green-600 dark:text-green-400">
                                      Converted → {getConvertedFilename(item.originalName, format)}
                                    </span>
                                  )}
                                  {item.status === 'error' && (
                                    <span className="text-destructive">{item.error}</span>
                                  )}
                                </div>
                                {item.status === 'processing' && (
                                  <Progress value={item.progress} className="h-1 mt-1" />
                                )}
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-1">
                                {item.status === 'error' && !batchProcessing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      reprocessFile(item.id)
                                    }}
                                    title="Retry"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {!batchProcessing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-white hover:bg-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeBatchFile(item.id)
                                    }}
                                    title="Remove"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Single Mode: File Selected */}
                    {!batchMode && imgSrc && (
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
                        <div className="relative flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt="preview"
                            className="w-16 h-16 object-contain rounded-lg border border-border bg-background shadow-sm"
                            onError={(e) => {
                              // Fallback: show a placeholder on error
                              e.currentTarget.style.display = 'none'
                            }}
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
                            className="h-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              const inp = document.getElementById('file-input') as HTMLInputElement | null
                              inp?.click()
                              // Remove focus outline
                              ;(e.target as HTMLButtonElement).blur()
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Change
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10"
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
                      multiple={batchMode}
                      onChange={onInputChange} 
                      className="sr-only" 
                    />
                    {/* Hidden image for loading original dimensions (single mode only) */}
                    {!batchMode && imgSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgSrc}
                        alt=""
                        onLoad={onPreviewLoad}
                        onError={onPreviewError}
                        className="sr-only"
                      />
                    )}
                  </div>
                  
                  {/* Error Display - Single Mode */}
                  {!batchMode && error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 mt-4">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-destructive text-sm mb-1">Upload Error</div>
                        <div className="text-sm text-destructive/80 leading-snug">{error}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Error Display - Batch Mode */}
                  {batchMode && batchError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 mt-4">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-destructive text-sm mb-1">Batch Error</div>
                        <div className="text-sm text-destructive/80 leading-snug whitespace-pre-line">{batchError}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>

              {/* Right Column / Single: Settings & Preview */}
              <div className={batchMode ? '' : 'space-y-6 sm:space-y-8'}>
              <Card className="minimal-card">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="font-headline text-lg sm:text-xl md:text-2xl tracking-tight flex items-center gap-2">
                    <Settings2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="truncate">
                      {batchMode ? 'Conversion Settings' : 'Conversion Settings & Live Preview'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-8">
                  <div className={`grid gap-6 sm:gap-8 ${batchMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                    {/* Left: Settings */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                          <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                          Output Settings {batchMode && <Badge variant="outline" className="ml-2 text-xs">Applied to all files</Badge>}
                        </h3>
                        
                        {/* Format Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="format" className="text-sm font-medium">Output Format</Label>
                          <Select value={format} onValueChange={(value: OutputFormat) => setFormat(value)} disabled={batchProcessing}>
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

                        {/* Dimensions - Different behavior for batch mode */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="width" className="text-sm font-medium">
                              Width (px) {batchMode && <span className="text-xs text-muted-foreground">(empty = original)</span>}
                            </Label>
                            <Input
                              id="width"
                              type="number"
                              min={1}
                              max={8000}
                              value={width === '' ? '' : String(width)}
                              onChange={e => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                              disabled={batchMode ? batchProcessing : !imgSrc}
                              placeholder={batchMode ? "Original" : "Auto"}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="height" className="text-sm font-medium">
                              Height (px) {batchMode && <span className="text-xs text-muted-foreground">(empty = original)</span>}
                            </Label>
                            <Input
                              id="height"
                              type="number"
                              min={1}
                              max={8000}
                              value={height === '' ? '' : String(height)}
                              onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                              disabled={batchMode ? batchProcessing : !imgSrc}
                              placeholder={batchMode ? "Original" : "Auto"}
                              className="h-10"
                            />
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 sm:space-y-4">
                          {!batchMode && (
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
                          )}

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
                                disabled={batchMode ? batchProcessing : !imgSrc}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Output Information - Single Mode Only */}
                      {!batchMode && imgSrc && (
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

                      {/* Batch Mode: Summary */}
                      {batchMode && batchFiles.length > 0 && (
                        <div className="space-y-3 sm:space-y-4">
                          <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                            <Archive className="h-4 w-4 sm:h-5 sm:w-5" />
                            Batch Summary
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div className="p-2 sm:p-3 bg-muted/20 rounded-lg text-center">
                              <div className="text-xs text-muted-foreground mb-1">Total Files</div>
                              <div className="font-medium text-xs sm:text-sm">{batchFiles.length}</div>
                            </div>
                            <div className="p-2 sm:p-3 bg-muted/20 rounded-lg text-center">
                              <div className="text-xs text-muted-foreground mb-1">Output Format</div>
                              <div className="font-medium text-xs sm:text-sm">{format.split('/')[1].toUpperCase()}</div>
                            </div>
                            <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg text-center">
                              <div className="text-xs text-muted-foreground mb-1">Completed</div>
                              <div className="font-medium text-xs sm:text-sm text-green-600 dark:text-green-400">
                                {batchFiles.filter(f => f.status === 'completed').length}
                              </div>
                            </div>
                            <div className="p-2 sm:p-3 bg-destructive/10 rounded-lg text-center">
                              <div className="text-xs text-muted-foreground mb-1">Failed</div>
                              <div className="font-medium text-xs sm:text-sm text-destructive">
                                {batchFiles.filter(f => f.status === 'error').length}
                              </div>
                            </div>
                          </div>
                          
                          {/* Batch Progress Bar */}
                          {batchProcessing && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Processing...</span>
                                <span className="font-medium">{batchProgress.current} / {batchProgress.total}</span>
                              </div>
                              <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Live Preview - Single Mode Only */}
                    {!batchMode && (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
                          <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                          Live Preview
                        </div>
                        <div className="bg-muted/30 border border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                          {imgSrc ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              {generatingPreview ? (
                                <div className="text-center space-y-3 sm:space-y-4">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-spin" />
                                  </div>
                                  <div className="text-sm font-medium text-muted-foreground">Generating preview...</div>
                                  <div className="text-xs text-muted-foreground/70">This may take a moment on mobile</div>
                                </div>
                              ) : previewUrl ? (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={previewUrl}
                                    alt="Live Preview"
                                    className="max-w-full max-h-[280px] sm:max-h-[380px] object-contain rounded-lg shadow-lg border border-border/50"
                                    style={{ imageRendering: 'crisp-edges' }}
                                  />
                                </>
                              ) : (
                                <div className="text-center space-y-3 sm:space-y-4">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-spin" />
                                  </div>
                                  <div className="text-sm font-medium text-muted-foreground">Loading preview...</div>
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
                    )}
                  </div>

                    {/* Action Buttons - Single Mode */}
                    {!batchMode && (
                      <div className="border-t pt-4 sm:pt-6">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
                          <Button
                            onClick={convert}
                            disabled={!imgSrc || !imageLoaded || processing}
                            size="lg"
                            className="sm:flex-1 w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          >
                            {processing ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Converting & Downloading...
                              </>
                            ) : !imageLoaded && imgSrc ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Loading Image...
                              </>
                          ) : downloadUrl && downloadBlobState ? (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Downloaded! Convert Another
                            </>
                          ) : (
                            <>
                              <Download className="h-5 w-5 mr-2" />
                              Convert & Download
                            </>
                          )}
                        </Button>

                        <div className="flex gap-2 sm:flex-col sm:items-end">
                          {downloadUrl && downloadBlobState && (
                            <Button variant="outline" onClick={handleDownload} size="lg" className="w-full sm:w-44 h-12 sm:h-14">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            onClick={clear}
                            disabled={processing}
                            size="lg"
                            className="w-full sm:w-44 h-12 sm:h-14"
                          >
                            <RotateCcw className="h-5 w-5 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Action Buttons - Batch Mode */}
                    {batchMode && (
                      <div className="border-t pt-4 sm:pt-6">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          {/* Primary Action and Download */}
                          <div className="flex-1 flex gap-2">
                            {!batchProcessing ? (
                              <>
                                <Button
                                  onClick={processBatch}
                                  disabled={batchFiles.length === 0}
                                  size="lg"
                                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                                >
                                  {batchZipBlob ? (
                                    <>
                                      <Play className="h-5 w-5 mr-2" />
                                      Process Again
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-5 w-5 mr-2" />
                                      Convert {batchFiles.length} File{batchFiles.length !== 1 ? 's' : ''}
                                    </>
                                  )}
                                </Button>
                                {batchZipBlob && (
                                  <Button
                                    variant="outline"
                                    onClick={handleBatchDownload}
                                    size="lg"
                                    className="h-12 sm:h-14 px-3 sm:px-6"
                                    title="Download the ZIP file"
                                  >
                                    <Archive className="h-5 w-5" />
                                    <span className="hidden sm:inline ml-2">Download ZIP</span>
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                onClick={cancelBatch}
                                variant="destructive"
                                size="lg"
                                className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold"
                              >
                                <X className="h-5 w-5 mr-2" />
                                Cancel Processing
                              </Button>
                            )}
                          </div>

                          {/* Clear All Button */}
                          <Button
                            variant="outline"
                            onClick={clearBatch}
                            disabled={batchProcessing}
                            size="lg"
                            className="h-12 sm:h-14 px-3 sm:px-6"
                          >
                            <Trash2 className="h-5 w-5" />
                            <span className="hidden sm:inline ml-2">Clear</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status Messages - Single Mode */}
                    {!batchMode && message && !message.includes('Downloaded') && (
                      <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-400 flex items-center justify-center flex-shrink-0">
                          <Loader2 className="h-3 w-3 text-white animate-spin" />
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-200 font-medium leading-snug">{message}</div>
                      </div>
                    )}
                    
                    {!batchMode && error && (
                      <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-destructive leading-snug font-medium">{error}</div>
                      </div>
                    )}
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </TooltipProvider>
  )
}

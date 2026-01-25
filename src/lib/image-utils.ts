import JSZip from 'jszip'

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export interface ConversionSettings {
  format: OutputFormat
  width: number | ''
  height: number | ''
  quality: number
}

export interface BatchFileItem {
  id: string
  file: File
  status: 'queued' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  convertedBlob?: Blob
  originalName: string
}

export interface BatchProgress {
  currentIndex: number
  totalFiles: number
  currentFile: string
  items: BatchFileItem[]
}

/**
 * Load an image from a data URL and return the HTMLImageElement
 */
export function loadImage(src: string, timeout = 10000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const timeoutId = setTimeout(() => reject(new Error('Image load timeout')), timeout)
    
    img.onload = () => {
      clearTimeout(timeoutId)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timeoutId)
      reject(new Error('Failed to load image'))
    }
    img.src = src
  })
}

/**
 * Read a File as a data URL using FileReader
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        resolve(result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Convert an image to a Blob with the specified format and settings
 */
export async function convertImageToBlob(
  imgSrc: string,
  settings: ConversionSettings
): Promise<Blob> {
  const { format, width, height, quality } = settings
  
  const img = await loadImage(imgSrc)
  
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
  
  if (!ctx) {
    throw new Error('Canvas not supported')
  }
  
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  
  const blob: Blob | null = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Blob conversion timeout'))
    }, 10000)
    
    canvas.toBlob(
      (b) => {
        clearTimeout(timeout)
        resolve(b)
      },
      format,
      format === 'image/jpeg' || format === 'image/webp' ? quality : undefined
    )
  })
  
  if (!blob) {
    throw new Error('Failed to create output blob')
  }
  
  return blob
}

/**
 * Get the new filename with the correct extension based on format
 */
export function getConvertedFilename(originalName: string, format: OutputFormat): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp'
  return `${nameWithoutExt}.${ext}`
}

/**
 * Generate a unique ID for batch file items
 */
export function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Validate a file for image conversion
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Not a valid image file' }
  }
  
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds 50MB limit' }
  }
  
  return { valid: true }
}

/**
 * Process a batch of files sequentially and yield progress updates
 */
export async function* processBatchQueue(
  items: BatchFileItem[],
  settings: ConversionSettings
): AsyncGenerator<BatchProgress, void, unknown> {
  const totalFiles = items.length
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    // Update status to processing
    item.status = 'processing'
    item.progress = 0
    
    yield {
      currentIndex: i,
      totalFiles,
      currentFile: item.originalName,
      items: [...items]
    }
    
    try {
      // Read file as data URL
      item.progress = 25
      yield {
        currentIndex: i,
        totalFiles,
        currentFile: item.originalName,
        items: [...items]
      }
      
      const dataUrl = await readFileAsDataURL(item.file)
      
      // Convert image
      item.progress = 50
      yield {
        currentIndex: i,
        totalFiles,
        currentFile: item.originalName,
        items: [...items]
      }
      
      const blob = await convertImageToBlob(dataUrl, settings)
      
      // Complete
      item.progress = 100
      item.status = 'completed'
      item.convertedBlob = blob
      
      yield {
        currentIndex: i,
        totalFiles,
        currentFile: item.originalName,
        items: [...items]
      }
    } catch (error) {
      item.status = 'error'
      item.progress = 0
      item.error = error instanceof Error ? error.message : 'Conversion failed'
      
      yield {
        currentIndex: i,
        totalFiles,
        currentFile: item.originalName,
        items: [...items]
      }
    }
  }
}

/**
 * Create a ZIP file from converted batch items
 */
export async function createBatchZip(
  items: BatchFileItem[],
  format: OutputFormat
): Promise<Blob> {
  const zip = new JSZip()
  
  const completedItems = items.filter(item => item.status === 'completed' && item.convertedBlob)
  
  if (completedItems.length === 0) {
    throw new Error('No successfully converted files to include in ZIP')
  }
  
  // Track filenames to handle duplicates
  const usedNames = new Map<string, number>()
  
  for (const item of completedItems) {
    let filename = getConvertedFilename(item.originalName, format)
    
    // Handle duplicate filenames
    if (usedNames.has(filename)) {
      const count = usedNames.get(filename)! + 1
      usedNames.set(filename, count)
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
      const ext = filename.split('.').pop()
      filename = `${nameWithoutExt}-${count}.${ext}`
    } else {
      usedNames.set(filename, 0)
    }
    
    zip.file(filename, item.convertedBlob!)
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  return zipBlob
}

/**
 * Download a blob file with mobile compatibility
 */
export function downloadBlob(
  blob: Blob,
  filename: string,
  useDataUrl = false
): void {
  if (useDataUrl) {
    // For iOS/Safari: Use FileReader to convert blob to data URL
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    reader.readAsDataURL(blob)
  } else {
    // For other browsers: Use blob URL
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Check if the current browser is iOS or Safari
 */
export function isIOSOrSafari(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !(typeof window !== 'undefined' && 'MSStream' in window)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  return isIOS || isSafari
}

/**
 * Format bytes to human-readable size
 */
export function humanSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

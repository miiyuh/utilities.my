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

import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { FileArrowDown } from '@phosphor-icons/react'

const hasFiles = (e: DragEvent) => Boolean(e.dataTransfer?.types.includes('Files'))

/**
 * Files dropped outside a tool's own drop area.
 *
 * On the home page, a dropped or pasted file opens search with the tools that
 * can open it. On every other page the drop is only caught, so the browser
 * doesn't leave the site to show the file. A tool's drop area handles its own
 * drops first and marks them handled, so they never reach this.
 */
export function FileDropCatcher({ onFiles }: { onFiles: (files: File[]) => void }) {
  const { pathname } = useLocation()
  const home = pathname === '/'
  const [over, setOver] = React.useState(false)

  React.useEffect(() => {
    // `dragleave` is unreliable at the window's edge, so the overlay hides
    // once `dragover` stops arriving.
    let hide = 0
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e) || e.defaultPrevented) return
      e.preventDefault()
      if (!home) return
      setOver(true)
      window.clearTimeout(hide)
      hide = window.setTimeout(() => setOver(false), 150)
    }
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e) || e.defaultPrevented) return
      e.preventDefault()
      window.clearTimeout(hide)
      setOver(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (home && files.length) onFiles(files)
    }
    const onPaste = (e: ClipboardEvent) => {
      if (!home || e.defaultPrevented) return
      const files = Array.from(e.clipboardData?.files ?? [])
      if (!files.length) return
      e.preventDefault()
      onFiles(files)
    }
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    document.addEventListener('paste', onPaste)
    return () => {
      window.clearTimeout(hide)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
      document.removeEventListener('paste', onPaste)
    }
  }, [home, onFiles])

  if (!over || !home) return null
  return (
    <div className="pointer-events-none fixed inset-3 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <FileArrowDown className="h-10 w-10 text-primary" />
        <p className="text-lg font-medium">Drop to see which tools can open it</p>
        <p className="text-sm text-muted-foreground">Nothing is uploaded. The file stays in your browser.</p>
      </div>
    </div>
  )
}

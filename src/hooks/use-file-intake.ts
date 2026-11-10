import * as React from 'react'
import { pickerAccept, sortFiles, type IntakeRules } from '@/lib/file-intake'

export interface FileIntakeOptions extends IntakeRules {
  /** Take several files at once. When false, only the first usable file is passed on. */
  multiple?: boolean
  /** Take files pasted anywhere on the page with Ctrl/⌘ V. Only one intake on a page should. */
  paste?: boolean
  /** Files that passed the checks, and why any others were turned away. */
  onFiles: (files: File[], problems: string[]) => void
}

export interface FileIntake {
  /** True while files are dragged over the drop zone. */
  dragging: boolean
  /** Attach to the element that takes dropped files. */
  dropTarget: (el: HTMLElement | null) => void
  /** Open the file picker. */
  open: () => void
  /** Spread onto a hidden `<input>`. */
  inputProps: {
    ref: (el: HTMLInputElement | null) => void
    type: 'file'
    accept: string
    multiple: boolean
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }
}

/** One way to bring files into a tool: choose, drop or paste, all checked the same way. */
export function useFileIntake(options: FileIntakeOptions): FileIntake {
  const latest = React.useRef(options)
  React.useEffect(() => {
    latest.current = options
  })

  const take = React.useCallback((files: File[]) => {
    if (!files.length) return
    const { accepts, maxBytes, multiple, onFiles } = latest.current
    const { accepted, problems } = sortFiles(files, { accepts, maxBytes })
    if (multiple) onFiles(accepted, problems)
    // One file wanted: the first usable one, and a reason only when none was.
    else if (accepted.length) onFiles(accepted.slice(0, 1), [])
    else onFiles([], problems.slice(0, 1))
  }, [])

  // Dragging is a pointer convenience (the picker is the accessible path), so
  // the listeners go straight on the element.
  const [zone, setZone] = React.useState<HTMLElement | null>(null)
  const [dragging, setDragging] = React.useState(false)
  React.useEffect(() => {
    if (!zone) return undefined
    const over = (e: DragEvent) => {
      e.preventDefault()
      setDragging(true)
    }
    const leave = (e: DragEvent) => {
      if (!(e.relatedTarget instanceof Node && zone.contains(e.relatedTarget))) setDragging(false)
    }
    const drop = (e: DragEvent) => {
      e.preventDefault()
      setDragging(false)
      take(Array.from(e.dataTransfer?.files ?? []))
    }
    zone.addEventListener('dragenter', over)
    zone.addEventListener('dragover', over)
    zone.addEventListener('dragleave', leave)
    zone.addEventListener('drop', drop)
    return () => {
      zone.removeEventListener('dragenter', over)
      zone.removeEventListener('dragover', over)
      zone.removeEventListener('dragleave', leave)
      zone.removeEventListener('drop', drop)
    }
  }, [zone, take])

  const paste = Boolean(options.paste)
  React.useEffect(() => {
    if (!paste) return undefined
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (!files.length) return
      e.preventDefault()
      take(files)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [paste, take])

  // A callback ref, so the props can be spread during render.
  const inputEl = React.useRef<HTMLInputElement | null>(null)
  const setInput = React.useCallback((el: HTMLInputElement | null) => {
    inputEl.current = el
  }, [])
  const open = React.useCallback(() => inputEl.current?.click(), [])
  const accept = pickerAccept(options.accepts)
  const multiple = Boolean(options.multiple)
  const inputProps = React.useMemo(
    () => ({
      ref: setInput,
      type: 'file' as const,
      accept,
      multiple,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        take(Array.from(e.target.files ?? []))
        e.target.value = ''
      },
    }),
    [accept, multiple, take, setInput]
  )

  return { dragging, dropTarget: setZone, open, inputProps }
}

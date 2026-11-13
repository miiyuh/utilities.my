import * as React from "react"
import { Copy, Check } from '@phosphor-icons/react'

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { VariantProps } from "class-variance-authority"

interface CopyButtonProps
  extends Omit<React.ComponentProps<"button">, "children" | "value">,
    VariantProps<typeof buttonVariants> {
  /** Text to copy, or a function returning it (evaluated at click time). */
  value: string | (() => string)
  /** Label shown in the idle state. Set to "" for an icon-only button. */
  label?: string
  /** Label shown for ~2s after a successful copy. Ignored when label is "". */
  copiedLabel?: string
  toastTitle?: string
  toastDescription?: string
  onCopied?: () => void
  /** Icon shown in the idle state. Defaults to a clipboard/copy glyph. */
  icon?: React.ReactNode
}

// Both icons stay mounted and crossfade: the leaving one shrinks, blurs and
// fades while the arriving one grows in, in both directions. Opacity, scale and
// a 2px blur only, so it stays on the compositor and reads as one change.
const SWAP = "inline-flex items-center justify-center transition-[opacity,scale,filter] duration-quick ease-smooth-out motion-reduce:transition-none [&_svg]:size-4"
const SHOWN = "opacity-100 scale-100 blur-none"
const HIDDEN = "opacity-0 scale-50 blur-[2px]"

/**
 * Standard copy-to-clipboard button: the icon turns into a check on success,
 * fixed width so the label swap doesn't resize the button, toast confirmation.
 * Works inside a tooltip trigger: a click handler passed in (Base UI's, which
 * closes the tooltip) runs as well as the copy, instead of replacing it.
 */
function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  toastTitle = "Copied",
  toastDescription = "Copied to clipboard.",
  onCopied,
  icon,
  variant = "outline",
  size = "default",
  className,
  disabled,
  onClick,
  ...props
}: CopyButtonProps) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])
  const iconOnly = label === ""

  const copy = async () => {
    const text = typeof value === "function" ? value() : value
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: toastTitle, description: toastDescription })
      setCopied(true)
      onCopied?.()
      // A second copy within 2s restarts the check's time rather than cutting it short.
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy to clipboard.", variant: "destructive" })
    }
  }

  const longest = label.length >= copiedLabel.length ? label : copiedLabel

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(className)}
      style={!iconOnly ? { minWidth: `calc(${longest.length}ch + 2.75rem)` } : undefined}
      {...props}
      onClick={(e) => {
        onClick?.(e)
        void copy()
      }}
    >
      <span className="relative inline-flex size-4 shrink-0 items-center justify-center" aria-hidden>
        <span className={cn(SWAP, copied ? HIDDEN : SHOWN)}>{icon ?? <Copy />}</span>
        <span className={cn(SWAP, "absolute inset-0", copied ? SHOWN : HIDDEN)}><Check weight="bold" /></span>
      </span>
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
      {iconOnly && <span className="sr-only">{copied ? copiedLabel : label || "Copy"}</span>}
    </Button>
  )
}

export { CopyButton }

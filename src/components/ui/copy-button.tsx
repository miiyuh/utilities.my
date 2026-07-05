import * as React from "react"
import { Copy, Check } from "phosphor-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { VariantProps } from "class-variance-authority"

interface CopyButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick" | "children" | "value">,
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

/**
 * Standard copy-to-clipboard button: white check-icon pop on success, fixed
 * width so the label swap doesn't resize the button, toast confirmation.
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
  ...props
}: CopyButtonProps) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)
  const iconOnly = label === ""

  const handleClick = async () => {
    const text = typeof value === "function" ? value() : value
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: toastTitle, description: toastDescription })
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
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
      onClick={handleClick}
      className={cn(className)}
      style={!iconOnly ? { minWidth: `calc(${longest.length}ch + 2.75rem)` } : undefined}
      {...props}
    >
      {copied ? (
        <Check key="check" className="h-4 w-4 shrink-0 animate-in zoom-in-50 duration-quick ease-bounce" />
      ) : icon ? (
        <span key="custom-icon" className="inline-flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4 animate-in zoom-in-50 duration-quick ease-bounce">{icon}</span>
      ) : (
        <Copy key="copy" className="h-4 w-4 shrink-0 animate-in zoom-in-50 duration-quick ease-bounce" />
      )}
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
      {iconOnly && <span className="sr-only">{copied ? copiedLabel : label || "Copy"}</span>}
    </Button>
  )
}

export { CopyButton }

import * as React from "react"
import { Trash, type Icon } from "phosphor-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ClearButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick" | "variant" | "children"> {
  /** Runs once the user confirms (or straight away when there is nothing to lose). */
  onClear: () => void
  /** Whether there is anything to clear. Empty means disabled; filled means confirm first. */
  hasContent: boolean
  label?: string
  /** Defaults to a bin; resets that restore defaults pass a reset arrow. */
  icon?: Icon
  /** Hide the text label (icon only); the label still names the button and its tooltip. */
  iconOnly?: boolean
  confirmTitle?: string
  confirmDescription?: string
  /** The confirm button's label; should repeat the consequence ("Remove image"). Defaults to `label`. */
  confirmLabel?: string
  /** "outline" for actions that replace content rather than delete it (Start over). Still confirms. */
  variant?: "destructive" | "outline"
}

/**
 * The one destructive "clear" control used across tools: red, disabled when
 * empty, and asks before throwing away what the user has typed or added.
 */
function ClearButton({
  onClear,
  hasContent,
  label = "Clear",
  icon: IconComponent = Trash,
  iconOnly = false,
  confirmTitle = "Clear everything?",
  confirmDescription = "This removes what you have entered. It can't be undone.",
  confirmLabel,
  variant = "destructive",
  size = "sm",
  disabled,
  ...props
}: ClearButtonProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={disabled || !hasContent}
          title={iconOnly ? label : undefined}
          // Some of these sit inside clickable areas (e.g. a drop zone); the
          // click, and those from the portalled dialog, must not reach them.
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          <IconComponent className="h-4 w-4" />
          {!iconOnly && <span>{label}</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()} onOverlayClick={() => setOpen(false)}>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onClear}>
            {confirmLabel ?? label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ClearButton }

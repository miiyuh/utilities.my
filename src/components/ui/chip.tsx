import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * A pill toggle for picking one option from a short set (put a group of them
 * in a <fieldset> with a <legend>). Pressed state is announced via aria-pressed.
 */
export function Chip({
  active,
  onClick,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<'button'>, 'onClick'> & { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-quick outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

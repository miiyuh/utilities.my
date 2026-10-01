"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

// Radix tooltips only open on hover and focus, so on a touchscreen they were
// unreachable. A tap on the trigger now opens the tooltip briefly; tapping
// anywhere else (or waiting) closes it.
const TOUCH_TOOLTIP_MS = 2500
const TooltipTouchContext = React.createContext<(() => void) | null>(null)

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const setOpen = React.useCallback(
    (next: boolean) => {
      clearTimeout(timer.current)
      if (openProp === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange]
  )

  const openFromTap = React.useCallback(() => {
    setOpen(true)
    timer.current = setTimeout(() => setOpen(false), TOUCH_TOOLTIP_MS)
  }, [setOpen])

  React.useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <TooltipTouchContext.Provider value={openFromTap}>
      <TooltipPrimitive.Root data-slot="tooltip" open={open} onOpenChange={setOpen} {...props} />
    </TooltipTouchContext.Provider>
  )
}

function TooltipTrigger({
  onPointerDown,
  onClick,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const openFromTap = React.useContext(TooltipTouchContext)
  const pointerType = React.useRef<string>("mouse")
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onPointerDown={(e) => {
        pointerType.current = e.pointerType
        onPointerDown?.(e)
      }}
      onClick={(e) => {
        onClick?.(e)
        if (pointerType.current !== "mouse") openFromTap?.()
      }}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=left]:translate-x-[-1.5px] data-[side=right]:translate-x-[1.5px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

/**
 * Shorthand for a tooltip on a single element: the replacement for the native
 * `title` attribute. Extra props (e.g. from an outer `asChild` trigger) are
 * forwarded to the wrapped element.
 */
function Hint({
  label,
  side,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TooltipPrimitive.Trigger>, "asChild"> & {
  label: React.ReactNode
  side?: React.ComponentProps<typeof TooltipPrimitive.Content>["side"]
  children: React.ReactElement
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild {...props}>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

export { Hint, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }

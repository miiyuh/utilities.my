import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"
import { tapChangeDetails } from "@/lib/tap-details"
import { useTouchTap } from "@/hooks/use-touch-tap"

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

// Base UI tooltips only open on hover and focus, so on a touchscreen they were
// unreachable. A tap on the trigger now opens the tooltip briefly; tapping
// anywhere else (or waiting) closes it.
const TOUCH_TOOLTIP_MS = 2500
const TooltipTouchContext = React.createContext<((e: React.MouseEvent<HTMLElement>) => void) | null>(null)

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: TooltipPrimitive.Root.Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleOpenChange = React.useCallback(
    (next: boolean, details: TooltipPrimitive.Root.ChangeEventDetails) => {
      clearTimeout(timer.current)
      if (openProp === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next, details)
    },
    [openProp, onOpenChange]
  )

  // Goes through handleOpenChange so a controlled `open` hears about taps too.
  const openFromTap = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const details = tapChangeDetails<TooltipPrimitive.Root.ChangeEventDetails>(e)
      handleOpenChange(true, details)
      timer.current = setTimeout(() => handleOpenChange(false, details), TOUCH_TOOLTIP_MS)
    },
    [handleOpenChange]
  )

  React.useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <TooltipTouchContext.Provider value={openFromTap}>
      <TooltipPrimitive.Root data-slot="tooltip" open={open} onOpenChange={handleOpenChange} {...props} />
    </TooltipTouchContext.Provider>
  )
}

function TooltipTrigger({
  onPointerDown,
  onClick,
  ...props
}: TooltipPrimitive.Trigger.Props) {
  const tap = useTouchTap(React.useContext(TooltipTouchContext), onPointerDown, onClick)
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      {...tap}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:translate-x-[1.5px] data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:translate-x-[-1.5px] data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:translate-x-[-1.5px] data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:translate-x-[1.5px] data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

/**
 * Shorthand for a tooltip on a single element: the replacement for the native
 * `title` attribute. Extra props (e.g. from an outer `render` trigger) are
 * forwarded to the wrapped element.
 */
function Hint({
  label,
  side,
  children,
  ...props
}: Omit<TooltipPrimitive.Trigger.Props, "render" | "children"> & {
  label: React.ReactNode
  side?: TooltipPrimitive.Positioner.Props["side"]
  children: React.ReactElement
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} {...props} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

export { Hint, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }

import * as React from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

/**
 * Base UI preview cards only respond to hover and focus. Like our tooltips,
 * this one also toggles on tap, so the card is reachable on touchscreens.
 */
const HoverCardTapContext = React.createContext<(() => void) | null>(null)

function HoverCard({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: PreviewCardPrimitive.Root.Props) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolled

  const handleOpenChange = React.useCallback(
    (next: boolean, details: PreviewCardPrimitive.Root.ChangeEventDetails) => {
      if (openProp === undefined) setUncontrolled(next)
      onOpenChange?.(next, details)
    },
    [openProp, onOpenChange]
  )

  // Taps are ours, not Base UI's, so they have no event details to report and
  // only drive the uncontrolled state.
  const toggle = React.useCallback(() => setUncontrolled((o) => !o), [])

  return (
    <HoverCardTapContext.Provider value={toggle}>
      <PreviewCardPrimitive.Root
        data-slot="hover-card"
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </HoverCardTapContext.Provider>
  )
}

function HoverCardTrigger({
  delay = 150,
  closeDelay = 120,
  onPointerDown,
  onClick,
  ...props
}: PreviewCardPrimitive.Trigger.Props) {
  const toggle = React.useContext(HoverCardTapContext)
  const pointerType = React.useRef("mouse")
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      delay={delay}
      closeDelay={closeDelay}
      onPointerDown={(e) => {
        pointerType.current = e.pointerType
        onPointerDown?.(e)
      }}
      onClick={(e) => {
        onClick?.(e)
        if (pointerType.current !== "mouse") toggle?.()
      }}
      {...props}
    />
  )
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "z-50 w-72 origin-(--transform-origin) rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none duration-fast data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }

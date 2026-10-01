import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Radix hover cards only respond to hover and focus. Like our tooltips, this
 * one also toggles on tap, so the card is reachable on touchscreens.
 */
const HoverCardTapContext = React.createContext<(() => void) | null>(null)

function HoverCard({
  openDelay = 150,
  closeDelay = 120,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolled
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolled(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange]
  )
  const toggle = React.useCallback(() => setOpen(!open), [open, setOpen])
  return (
    <HoverCardTapContext.Provider value={toggle}>
      <HoverCardPrimitive.Root
        data-slot="hover-card"
        openDelay={openDelay}
        closeDelay={closeDelay}
        open={open}
        onOpenChange={setOpen}
        {...props}
      />
    </HoverCardTapContext.Provider>
  )
}

function HoverCardTrigger({ onPointerDown, onClick, ...props }: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  const toggle = React.useContext(HoverCardTapContext)
  const pointerType = React.useRef("mouse")
  return (
    <HoverCardPrimitive.Trigger
      data-slot="hover-card-trigger"
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
  align = "center",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-fast",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }

"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-2xl p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-auto group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:p-1 data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface IndicatorBox {
  x: number
  y: number
  w: number
  h: number
}

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<IndicatorBox | null>(null)
  // No transition until the active tab first changes, so nothing slides in on page load.
  const [animate, setAnimate] = React.useState(false)
  const activeRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-state="active"]')
      if (activeRef.current && active && active !== activeRef.current) setAnimate(true)
      activeRef.current = active
      setBox(active ? { x: active.offsetLeft, y: active.offsetTop, w: active.offsetWidth, h: active.offsetHeight } : null)
    }
    measure()
    // Follow the active tab (Radix flips data-state) and any change in the tabs' sizes.
    const mutations = new MutationObserver(measure)
    mutations.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state"] })
    const resizes = new ResizeObserver(measure)
    resizes.observe(list)
    list.querySelectorAll('[data-slot="tabs-trigger"]').forEach((t) => resizes.observe(t))
    return () => {
      mutations.disconnect()
      resizes.disconnect()
    }
  }, [])

  const line = variant === "line"

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), "relative", className)}
      {...props}
    >
      {box && (
        <span
          aria-hidden
          data-slot="tabs-indicator"
          className={cn(
            "pointer-events-none absolute top-0 left-0",
            line ? "h-0.5 bg-foreground" : "rounded-2xl bg-background shadow-sm dark:border dark:border-input dark:bg-input/30",
            animate && "transition-[transform,width,height] duration-fast ease-smooth-out motion-reduce:transition-none"
          )}
          style={
            line
              ? { transform: `translate(${box.x}px, ${box.y + box.h + 3}px)`, width: box.w }
              : { transform: `translate(${box.x}px, ${box.y}px)`, width: box.w, height: box.h }
          }
        />
      )}
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-[1] inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-transparent! px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,box-shadow] duration-quick ease-smooth-out group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[orientation=vertical]/tabs:px-3 group-data-[orientation=vertical]/tabs:py-0.5 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // The active background (or underline) is the list's sliding indicator, so triggers only change text colour.
        "data-[state=active]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm outline-none animate-in fade-in-0 duration-quick ease-smooth-out",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }

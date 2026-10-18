import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
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

function TabsList({
  className,
  variant = "default",
  // Arrow keys select the tab they move to, as Radix tabs did.
  activateOnFocus = true,
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      activateOnFocus={activateOnFocus}
      className={cn(tabsListVariants({ variant }), "relative", className)}
      {...props}
    >
      {/* Base UI keeps the active tab's box in CSS variables; this slides to it. */}
      <TabsPrimitive.Indicator
        data-slot="tabs-indicator"
        className={cn(
          "pointer-events-none absolute top-0 left-0 w-(--active-tab-width) translate-x-(--active-tab-left) transition-[translate,width,height] duration-fast ease-smooth-out motion-reduce:transition-none",
          variant === "line"
            ? "h-0.5 translate-y-[calc(var(--active-tab-top)+var(--active-tab-height)+3px)] bg-foreground"
            : "h-(--active-tab-height) translate-y-(--active-tab-top) rounded-2xl bg-background shadow-sm dark:border dark:border-input dark:bg-input/30"
        )}
      />
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative z-[1] inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-transparent! px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,box-shadow] duration-quick ease-smooth-out group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[orientation=vertical]/tabs:px-3 group-data-[orientation=vertical]/tabs:py-0.5 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // The active background (or underline) is the list's sliding indicator, so triggers only change text colour.
        "data-active:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }

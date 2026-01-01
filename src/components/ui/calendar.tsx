
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: cn(
          "flex justify-center relative items-center",
          "py-1" 
        ),
        caption_label: cn(
          "text-sm font-medium",
          props.captionLayout?.includes("dropdown") && "hidden" 
        ),
        caption_dropdowns: cn(
          "flex items-center gap-2", 
          "mx-8" 
        ),
        dropdown: cn( 
          buttonVariants({ variant: "outline" }),
          "h-7 text-sm px-2 py-1 font-normal", 
          "text-foreground bg-transparent hover:bg-accent hover:text-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 focus:ring-offset-0"
        ),
        dropdown_month: "rdp-dropdown_month", 
        dropdown_year: "rdp-dropdown_year",   
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: cn(
          "absolute left-1",
          "top-1/2 -translate-y-1/2" 
        ),
        nav_button_next: cn(
          "absolute right-1",
          "top-1/2 -translate-y-1/2" 
        ),
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center", // Changed w-9 to flex-1, added text-center
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20", // Changed w-9 to flex-1
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected].day-range-start)]:rounded-l-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          "hover:bg-muted hover:text-foreground"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground", 
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className: iconClassName, ...iconProps }) => ( 
          <ChevronLeft className={cn("h-4 w-4", iconClassName)} {...iconProps} />
        ),
        IconRight: ({ className: iconClassName, ...iconProps }) => ( 
          <ChevronRight className={cn("h-4 w-4", iconClassName)} {...iconProps} />
        ),
        Dropdown: ({ value, onChange, children }: DropdownProps) => {
          const options = React.Children.toArray(children) as React.ReactElement<React.HTMLProps<HTMLOptionElement>>[]
          const selected = options.find((child) => child.props.value === value)
          const handleChange = (value: string) => {
            const changeEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLSelectElement>
            onChange?.(changeEvent)
          }
          return (
            <Select
              value={value?.toString()}
              onValueChange={(value) => {
                handleChange(value)
              }}
            >
              <SelectTrigger className="pr-1.5 focus:ring-0 h-7 w-auto gap-1 text-sm font-medium border-none bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground">
                <SelectValue>{selected?.props?.children}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper">
                <ScrollArea className="h-80">
                  {options.map((option, id) => (
                    <SelectItem key={`${option.props.value}-${id}`} value={option.props.value?.toString() ?? ""}>
                      {option.props.children}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

"use client"

import * as React from "react"
import { Combobox as BaseCombobox } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

export interface ComboboxItem {
  value: string
  label: string
  description?: string
  leading?: React.ReactNode
}

export interface ComboboxProps {
  items: ComboboxItem[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  defaultValue?: string
  resetOnSelect?: boolean
  contentClassName?: string
  className?: string
  disabled?: boolean
}

function getItemLabel(item: ComboboxItem | null) {
  return item ? item.label : ""
}

function isItemEqualToValue(itemValue: ComboboxItem | null, selectedValue: ComboboxItem | null) {
  if (!itemValue && !selectedValue) return true;
  if (!itemValue || !selectedValue) return false;
  return itemValue.value === selectedValue.value;
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "",
  resetOnSelect = false,
  contentClassName,
  className,
  disabled = false,
}: ComboboxProps) {
  const id = React.useId()
  const [inputValue, setInputValue] = React.useState("")
  
  // Find the selected item based on value
  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value]
  )

  // Sync input value with selected item
  React.useEffect(() => {
    if (selectedItem && !resetOnSelect) {
      setInputValue(selectedItem.label)
    } else if (!selectedItem && !resetOnSelect) {
      setInputValue("")
    }
  }, [selectedItem, resetOnSelect])

  const handleValueChange = React.useCallback(
    (newValue: ComboboxItem | null) => {
      if (newValue) {
        onValueChange?.(newValue.value)
        if (resetOnSelect) {
          setInputValue("")
        }
      }
    },
    [onValueChange, resetOnSelect]
  )

  return (
    <BaseCombobox.Root
      items={items}
      value={selectedItem}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      itemToStringLabel={getItemLabel}
      isItemEqualToValue={isItemEqualToValue}
    >
      <div className={cn("relative w-full", className)}>
        <BaseCombobox.Input
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm",
            "placeholder:text-muted-foreground/60",
            "hover:border-primary/60",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "transition-all duration-200 shadow-sm",
            "pr-10"
          )}
        />
        <div className={cn(
          "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground/60",
          "transition-colors duration-200"
        )}>
          <ChevronsUpDown className="size-4" />
        </div>
      </div>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner 
          sideOffset={8} 
          align="start"
          className="z-[10000]"
        >
          <BaseCombobox.Popup
            className={cn(
              "z-[10000] w-[var(--anchor-width)] max-h-[min(var(--available-height),20rem)] rounded-lg border border-border bg-popover text-popover-foreground shadow-xl outline-none overflow-hidden",
              "origin-[var(--transform-origin)]",
              "transition-[transform,opacity] duration-200 ease-out",
              "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
              "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
              "data-[side=bottom]:data-[starting-style]:-translate-y-2",
              "data-[side=top]:data-[starting-style]:translate-y-2",
              contentClassName
            )}
          >
            <BaseCombobox.Empty className="px-4 pt-3 text-sm text-muted-foreground text-center">
              No results found.
            </BaseCombobox.Empty>
            <BaseCombobox.List className="overflow-y-auto overscroll-contain p-1.5 max-h-[min(var(--available-height),20rem)]">
              {(item: ComboboxItem) => (
                <BaseCombobox.Item
                  key={item.value}
                  value={item}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center gap-3 px-3 py-2.5 text-sm outline-none transition-colors rounded-lg mb-0.5 last:mb-0",
                    "data-[highlighted]:bg-muted/60",
                    "data-[selected]:bg-primary/10 data-[selected]:text-primary font-medium"
                  )}
                >
                  {item.leading && (
                    <span className="flex flex-shrink-0 items-center text-lg leading-none">{item.leading}</span>
                  )}
                  <div className="flex flex-1 flex-col min-w-0 gap-0.5">
                    <span className="truncate">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground/80 truncate font-normal">
                        {item.description}
                      </span>
                    )}
                  </div>
                  <BaseCombobox.ItemIndicator className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-primary ml-auto">
                    <Check className="size-3.5" />
                  </BaseCombobox.ItemIndicator>
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  )
}

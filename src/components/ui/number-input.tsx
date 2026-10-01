import * as React from "react"

import { Input } from "@/components/ui/input"
import { useSettings } from "@/contexts/settings-context"
import { groupDigits, parseGrouped, separators } from "@/lib/format"

type NumberInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  /** Raw, ungrouped value with "." as the decimal point, e.g. "1234.5". */
  value: string
  onValueChange: (raw: string) => void
}

/**
 * A text input that groups thousands as you type (100000 → 100,000) using the
 * site's number format, while the caller only ever sees the raw value.
 */
function NumberInput({ value, onValueChange, onKeyDown, ...props }: NumberInputProps) {
  const { settings } = useSettings()
  const { group } = separators(settings.numberFormat)
  const display = groupDigits(value, settings.numberFormat)

  const ref = React.useRef<HTMLInputElement>(null)
  // Caret position measured in "significant" characters (digits, sign,
  // decimal) so it survives separators being added or removed around it.
  const pendingCaret = React.useRef<number | null>(null)
  const [, rerender] = React.useReducer((x: number) => x + 1, 0)

  const isSignificant = (ch: string) => ch !== group

  React.useLayoutEffect(() => {
    const el = ref.current
    const target = pendingCaret.current
    if (!el || target === null || document.activeElement !== el) return
    pendingCaret.current = null
    let seen = 0
    let pos = 0
    while (pos < el.value.length && seen < target) {
      if (isSignificant(el.value[pos])) seen++
      pos++
    }
    el.setSelectionRange(pos, pos)
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    const caret = e.target.selectionStart ?? text.length
    let left = 0
    for (let i = 0; i < caret; i++) if (isSignificant(text[i])) left++

    const raw = parseGrouped(text, settings.numberFormat)
    if (raw === null) {
      // Rejected keystroke: the typed character counted towards `left`.
      pendingCaret.current = Math.max(0, left - 1)
      rerender()
      return
    }
    pendingCaret.current = left
    if (raw === value) rerender()
    else onValueChange(raw)
  }

  // Backspace/Delete next to a separator removes the neighbouring digit
  // instead of the separator (which would just be re-inserted).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const el = e.currentTarget
    const start = el.selectionStart
    if (start === null || start !== el.selectionEnd) return
    if (e.key === "Backspace" && start > 0 && el.value[start - 1] === group) {
      el.setSelectionRange(start - 1, start - 1)
    } else if (e.key === "Delete" && el.value[start] === group) {
      el.setSelectionRange(start + 1, start + 1)
    }
  }

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={display}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export { NumberInput }

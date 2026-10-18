import * as React from "react"

/**
 * Wraps a trigger's pointer-down and click handlers so a touch or pen tap (not
 * a mouse click) also calls `onTap`. Base UI turns hover-style popups off on
 * touch, so the tooltip and hover card use this to stay reachable there.
 */
export function useTouchTap<
  P extends React.PointerEvent<HTMLElement>,
  C extends React.MouseEvent<HTMLElement>,
>(
  onTap: ((e: C) => void) | null,
  onPointerDown?: (e: P) => void,
  onClick?: (e: C) => void
) {
  const pointerType = React.useRef("mouse")
  return {
    onPointerDown: (e: P) => {
      pointerType.current = e.pointerType
      onPointerDown?.(e)
    },
    onClick: (e: C) => {
      onClick?.(e)
      if (pointerType.current !== "mouse") onTap?.(e)
    },
  }
}

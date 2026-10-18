import type * as React from "react"

/**
 * Change-event details for a touch tap that our tooltip and hover card turn
 * into an open/close. Base UI only builds these for hover, focus and press,
 * and doesn't export its factory, so this mirrors a "trigger-press" by hand
 * and lets `onOpenChange` fire for taps like it does for everything else.
 */
export function tapChangeDetails<Details>(event: React.MouseEvent<HTMLElement>): Details {
  return {
    reason: "trigger-press",
    event: event.nativeEvent,
    trigger: event.currentTarget,
    isCanceled: false,
    isPropagationAllowed: false,
    cancel() {},
    allowPropagation() {},
    preventUnmountOnClose() {},
  } as Details
}

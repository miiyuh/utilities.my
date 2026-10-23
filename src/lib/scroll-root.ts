import { prefersReducedMotion } from '@/lib/a11y-preferences'

/**
 * What scrolls the page: the inset panel's body on desktop, where the panel
 * is locked to the viewport, or the window on mobile, where it isn't.
 */
export function getScrollRoot(): HTMLElement | Window {
  const body = document.querySelector<HTMLElement>('[data-slot=sidebar-inset-body]')
  return body && getComputedStyle(body).overflowY === 'auto' ? body : window
}

export function getScrollTop(root: HTMLElement | Window = getScrollRoot()): number {
  return root instanceof Window ? root.scrollY : root.scrollTop
}

/** Scroll the page so `el` sits a little below the top of what's visible. */
export function scrollToElement(el: HTMLElement, behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth') {
  const root = getScrollRoot()
  // The window scrolls under the sticky header; the inset body starts below it.
  const gap = root instanceof Window ? 100 : 36
  const rootTop = root instanceof Window ? 0 : root.getBoundingClientRect().top
  root.scrollTo({ top: el.getBoundingClientRect().top - rootTop + getScrollTop(root) - gap, behavior })
}

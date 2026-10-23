import * as React from 'react'
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom'
import { getScrollRoot, getScrollTop } from '@/lib/scroll-root'

/** Scroll position per history entry, so Back and Forward return to where you were. */
const positions = new Map<string, number>()

/**
 * Scroll behaviour for client-side navigation, which the browser doesn't
 * handle for a single-page app:
 * - a new page (link, palette, redirect) starts at the top;
 * - Back and Forward restore the position that page was left at;
 * - links with a #hash are left to scroll to their anchor.
 */
export function RouteScroll() {
  const location = useLocation()
  const navigationType = useNavigationType()

  React.useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  React.useLayoutEffect(() => {
    const key = location.key
    const save = () => positions.set(key, getScrollTop())
    // Capture, because the inset panel's scroll events don't bubble to window.
    const stop = () => window.removeEventListener('scroll', save, { capture: true })
    window.addEventListener('scroll', save, { capture: true, passive: true })

    if (location.hash) return stop

    const saved = navigationType === NavigationType.Pop ? positions.get(key) : undefined
    if (saved === undefined) {
      getScrollRoot().scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return stop
    }

    // A lazily loaded page may not be mounted or tall enough yet: retry for a
    // moment, looking up the scroll root each time as the panel may be new.
    let frame = 0
    let tries = 0
    const restore = () => {
      const root = getScrollRoot()
      root.scrollTo({ top: saved, left: 0, behavior: 'instant' })
      if (Math.abs(getScrollTop(root) - saved) > 1 && tries++ < 60) frame = requestAnimationFrame(restore)
    }
    restore()
    return () => {
      cancelAnimationFrame(frame)
      stop()
    }
  }, [location.key, location.hash, navigationType])

  return null
}

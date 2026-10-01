import * as React from 'react'
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom'

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
    const save = () => positions.set(key, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })

    if (location.hash) return () => window.removeEventListener('scroll', save)

    const saved = navigationType === NavigationType.Pop ? positions.get(key) : undefined
    if (saved === undefined) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return () => window.removeEventListener('scroll', save)
    }

    // A lazily loaded page may not be tall enough yet: retry for a moment.
    let frame = 0
    let tries = 0
    const restore = () => {
      window.scrollTo({ top: saved, left: 0, behavior: 'instant' })
      if (Math.abs(window.scrollY - saved) > 1 && tries++ < 60) frame = requestAnimationFrame(restore)
    }
    restore()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', save)
    }
  }, [location.key, location.hash, navigationType])

  return null
}

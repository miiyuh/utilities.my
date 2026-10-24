import * as React from 'react'

import { cn } from '@/lib/utils'
import { getScrollRoot } from '@/lib/scroll-root'

/** Gap kept above (and, to fit, below) a stuck column: the page's own lg:p-8 padding. */
const GAP = 32

/**
 * A side column that stays in view while the other column scrolls (on large
 * screens). It only sticks while it fits on screen: a column taller than the
 * view would hide its own bottom until the end of the page.
 */
export function StickyColumn({ className, ...props }: React.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [fits, setFits] = React.useState(true)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      const root = getScrollRoot()
      const visible = root instanceof Window ? window.innerHeight : root.clientHeight
      setFits(el.offsetHeight + GAP * 2 <= visible)
    }
    const observer = new ResizeObserver(check)
    observer.observe(el)
    window.addEventListener('resize', check)
    check()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', check)
    }
  }, [])

  return <div ref={ref} className={cn(fits && 'lg:sticky lg:top-8', className)} {...props} />
}

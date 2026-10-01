import type { ReactNode } from 'react'

/**
 * A tool page's title and one-line description. The same size and spacing on
 * every page; the space below it comes from the page's `space-y-8` container.
 * On phones it's visually hidden (the header shows the title) but stays the
 * page's h1 for screen readers.
 */
export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="max-sm:sr-only">
      <h1 className="mb-4 border-b border-border pb-3 text-4xl font-bold tracking-tight text-balance text-foreground sm:mb-6 sm:pb-4 sm:text-5xl">{title}</h1>
      {children && <p className="max-w-3xl text-base text-pretty text-muted-foreground sm:text-lg">{children}</p>}
    </div>
  )
}

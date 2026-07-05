import type { ComponentType, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggleButton } from '@/components/theme-toggle-button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  icon: ComponentType<{ className?: string }>
  title: string
  /** Extra actions rendered between the title and the theme toggle. */
  children?: ReactNode
}

/**
 * Shared sticky page header used by every tool page so layout, spacing,
 * and motion stay identical across the site. On mobile, the home page shows
 * just the wordmark logo; every other page shows its own icon and title
 * instead, same as desktop.
 */
export function PageHeader({ icon: Icon, title, children }: PageHeaderProps) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        {isHome && (
          <img
            src="/assets/img/utilities-my_text.svg"
            alt="utilities.my"
            className="h-5 w-auto object-contain sm:hidden"
          />
        )}
        <Icon className={cn('h-5 w-5 shrink-0 text-foreground', isHome && 'hidden sm:block')} />
        <h1 className={cn('truncate text-xl font-semibold font-headline', isHome && 'hidden sm:block')}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggleButton />
      </div>
    </header>
  )
}

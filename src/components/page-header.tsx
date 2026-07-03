import type { ComponentType, ReactNode } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggleButton } from '@/components/theme-toggle-button'

interface PageHeaderProps {
  icon: ComponentType<{ className?: string }>
  title: string
  /** Extra actions rendered between the title and the theme toggle. */
  children?: ReactNode
}

/**
 * Shared sticky page header used by every tool page so layout, spacing,
 * and motion stay identical across the site.
 */
export function PageHeader({ icon: Icon, title, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <h1 className="truncate text-xl font-semibold font-headline">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggleButton />
      </div>
    </header>
  )
}

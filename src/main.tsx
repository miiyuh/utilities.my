import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, useTheme } from 'next-themes'
import { Toaster } from 'sonner'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SettingsProvider } from '@/contexts/settings-context'
import { Analytics } from "@vercel/analytics/react"
import { CommandPaletteProvider } from '@/components/command-palette'
import App from './App'
import './globals.css'

// Follow the site's resolved theme rather than the OS, so toasts match the
// light/dark choice the user made with the toggle.
function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="bottom-right"
      closeButton
      toastOptions={{
        duration: 4000,
        className: 'font-sans',
        style: {
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        },
      }}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      // First visit follows the OS; once the user toggles, their light/dark
      // choice is stored and wins. There is no explicit "system" option.
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark']}
      disableTransitionOnChange
      storageKey="utilities.my-theme"
      // next-themes renders an anti-flash <script> meant for server rendering. In
      // this client-rendered app it never runs (and React 19.3 warns about it),
      // so it is marked as an inert data block.
      scriptProps={{ type: 'application/json' }}
    >
      <BrowserRouter>
        <div id="main-content" className="relative z-20">
          <SettingsProvider>
            <TooltipProvider>
            <SidebarProvider>
              <CommandPaletteProvider>
              <App />
              <ThemedToaster />
              <Analytics />
              </CommandPaletteProvider>
            </SidebarProvider>
            </TooltipProvider>
          </SettingsProvider>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)

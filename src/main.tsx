import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SettingsProvider } from '@/contexts/settings-context'
import { Analytics } from "@vercel/analytics/react"
import App from './App'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="utilities.my-theme"
    >
      <BrowserRouter>
        <div id="main-content" className="relative z-20">
          <SettingsProvider>
            <TooltipProvider>
            <SidebarProvider>
              <App />
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
                theme="system"
              />
              <Analytics />
            </SidebarProvider>
            </TooltipProvider>
          </SettingsProvider>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)

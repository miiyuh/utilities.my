import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { SidebarProvider } from '@/components/ui/sidebar'
import { SettingsProvider } from '@/contexts/settings-context'
import App from './App'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
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
              <SidebarProvider>
                <App />
                <Toaster 
                  position="bottom-right"
                  closeButton
                  toastOptions={{
                    duration: 4000,
                    className: 'font-sans',
                    style: {
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    },
                  }}
                  theme="system"
                />
              </SidebarProvider>
            </SettingsProvider>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>
)

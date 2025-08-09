import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SettingsProvider } from '@/contexts/settings-context';
import { DotGridBackground } from '@/components/dot-grid-background';

export const metadata: Metadata = {
  title: 'utilities.my',
  description: 'a collection of useful tools, by miiyuh',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="utilities.my-theme">
          {/* Background lives inside ThemeProvider so it can react to theme changes */}
          <DotGridBackground />
          <div className="relative z-20">
            <SettingsProvider>
              <SidebarProvider>
                {children}
                <Toaster />
              </SidebarProvider>
            </SettingsProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

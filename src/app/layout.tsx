import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SettingsProvider } from '@/contexts/settings-context';
import { InteractiveGridBackground } from '@/components/interactive-grid-background';
import { inter, sourceCodePro } from '@/lib/fonts';
import Script from "next/script";

const metadataBase = new URL('https://utilities.my');

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'utilities.my - free online tools',
    template: '%s | utilities.my',
  },
  description: 'a fast, privacy-friendly collection of free online tools by miiyuh.',
  keywords: [
    'free online tools',
    'utilities',
    'no signup required',
    'privacy-first tools',
    'qr code generator',
    'BMI calculator',
    'color picker',
    'markdown preview',
    'unit converter',
    'timezone converter',
    'world clock',
    'date difference calculator',
    'text case converter',
    'text statistics',
    'sorter',
    'morse code generator',
    'percentage calculator',
    'shoe size converter',
    'image converter',
    'spin the wheel',
  ],
  authors: [{ name: 'miiyuh', url: 'https://miiyuh.com' }],
  creator: 'miiyuh',
  publisher: 'utilities.my',
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'utilities.my',
    title: 'utilities.my - free online tools',
    description: 'a fast, privacy-friendly collection of free online tools. no signup required.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'utilities.my - free online tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@miiyuh',
    site: '@miiyuh',
    title: 'utilities.my - free online tools',
    description: 'a fast, privacy-friendly collection of free online tools. no signup required.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'utilities',
  applicationName: 'utilities.my',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'utilities.my',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7ece6' },
    { media: '(prefers-color-scheme: dark)', color: '#141415' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sourceCodePro.variable}`}>
      <head>
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'utilities.my',
              url: metadataBase.origin,
              description: 'a fast, privacy-friendly collection of free online tools.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${metadataBase.origin}/?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:top-0 focus:left-0"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="utilities.my-theme"
        >
          <InteractiveGridBackground />
          <div id="main-content" className="relative z-20">
            <SettingsProvider>
              <SidebarProvider>
                {children}
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
        </ThemeProvider>
      </body>
    </html>
  );
}

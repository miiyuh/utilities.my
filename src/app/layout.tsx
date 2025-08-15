import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SettingsProvider } from '@/contexts/settings-context';

// Assumes production URL is https://utilities.my
const metadataBase = new URL('https://utilities.my');

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'utilities.my — Useful online tools',
    template: '%s | utilities.my',
  },
  description: 'A fast, privacy-friendly collection of useful tools: BMI calculator, QR code generator, color picker, unit converter, and more — by miiyuh.',
  keywords: [
    'utilities',
    'online tools',
    'qr code generator',
    'BMI calculator',
    'color picker',
    'markdown preview',
    'unit converter',
    'timezone converter',
    'date difference',
    'text case',
    'text statistics',
    'sorter',
  ],
  authors: [{ name: 'miiyuh' }],
  creator: 'miiyuh',
  publisher: 'utilities.my',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'utilities.my',
    title: 'utilities.my — Useful online tools',
    description: 'A fast, privacy-friendly collection of useful tools.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'utilities.my — Useful online tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@miiyuh',
    site: '@miiyuh',
    title: 'utilities.my — Useful online tools',
    description: 'A fast, privacy-friendly collection of useful tools.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
  category: 'utilities',
  applicationName: 'utilities.my',
  icons: {
    shortcut: ['/favicon.ico'],
  },
};

export const viewport: Viewport = {
  themeColor: '#1f2937',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
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
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Structured data */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'utilities.my',
              url: metadataBase.origin,
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
      <body className="antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="utilities.my-theme">
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

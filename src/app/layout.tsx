import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SettingsProvider } from '@/contexts/settings-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://utilities.my'),
  title: {
    default: 'utilities.my',
    template: '%s · utilities.my',
  },
  description: 'A fast, privacy-friendly collection of useful, everyday web tools: converters, generators, calculators, and more.',
  keywords: [
    'utilities', 'tools', 'web tools', 'qr code generator', 'bmi calculator', 'timezone converter', 'unit converter',
    'markdown previewer', 'text utilities', 'color picker', 'date difference', 'qr', 'converter', 'calculator'
  ],
  authors: [{ name: 'miiyuh' }],
  creator: 'miiyuh',
  publisher: 'utilities.my',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'utilities.my',
    title: 'utilities.my',
    description: 'Privacy-friendly, fast web utilities: converters, generators, calculators, and more.',
    url: 'https://utilities.my/',
    images: [
      { url: '/api/og?title=utilities.my&subtitle=Web%20tools', width: 1200, height: 630, alt: 'utilities.my' },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'utilities.my',
    description: 'Privacy-friendly, fast web utilities: converters, generators, calculators, and more.',
  images: ['/api/og?title=utilities.my&subtitle=Web%20tools'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'tools',
  icons: {
    icon: [{ url: '/favicon.ico' }],
  },
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
        {/* JSON-LD: WebSite and Organization */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  name: 'utilities.my',
                  url: 'https://utilities.my/',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://utilities.my/?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  name: 'utilities.my',
                  url: 'https://utilities.my/',
                  logo: 'https://utilities.my/assets/img/utilities-my_text.svg',
                },
              ],
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

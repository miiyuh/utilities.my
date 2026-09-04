// src/lib/seo.ts
//
// Single source of truth for per-route metadata. Consumed by two places:
//   - <RouteMeta /> (src/components/route-meta.tsx) for the live <head>
//   - scripts/build-seo.ts for the prerendered HTML, sitemap, and OG cards
// Keep this file dependency-free: the build script imports it directly under
// Bun, without React or any browser globals in scope.

export const SITE_URL = 'https://utilities.my'
export const SITE_NAME = 'utilities.my'
export const TWITTER_HANDLE = '@miiyuh'

export interface RouteSeo {
  /** Route path, exactly as declared in src/App.tsx. */
  path: string
  /** Full <title>. Aim for <= 60 characters so Google does not truncate it. */
  title: string
  /** Visible heading, and the heading seeded into the prerendered HTML. */
  h1: string
  /** Meta description. Aim for 140-160 characters. */
  description: string
  /** 'tool' entries get SoftwareApplication JSON-LD; 'page' entries get WebPage. */
  kind: 'tool' | 'page'
  /** Sitemap priority. Entries without one are excluded from the sitemap. */
  priority?: number
  /** Keeps the route out of the sitemap and adds <meta name="robots" content="noindex">. */
  noindex?: boolean
}

export const routes: RouteSeo[] = [
  {
    path: '/',
    title: 'Free online tools — no signup, no tracking | utilities.my',
    h1: 'Essential utilities for all!',
    description:
      'A fast collection of free online tools: unit and timezone converters, QR codes, BMI and percentage calculators, a colour picker and more. Runs in your browser.',
    kind: 'page',
    priority: 1.0,
  },
  {
    path: '/text-case',
    title: 'Text Case Converter — Upper, Lower, Title Case | utilities.my',
    h1: 'Text Case Converter',
    description:
      'Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case and kebab-case instantly. Free, and nothing leaves your browser.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/colour-picker',
    title: 'Colour Picker — HEX, RGB and HSL Codes | utilities.my',
    h1: 'Colour Picker',
    description:
      'Pick any colour and copy it as a HEX, RGB, HSL or OKLCH code. Includes a live preview and one-click copying, with every value computed locally in your browser.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/unit-converter',
    title: 'Unit Converter — Length, Weight, Temperature | utilities.my',
    h1: 'Unit Converter',
    description:
      'Convert between metric and imperial units for length, weight, temperature, area, volume and speed. Accurate, instant and free, with no signup required.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/bmi-calculator',
    title: 'BMI Calculator — Metric and Imperial | utilities.my',
    h1: 'BMI Calculator',
    description:
      'Work out your Body Mass Index from height and weight in either metric or imperial units, and see which healthy-weight category the result falls into.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/image-converter',
    title: 'Image Converter — PNG, JPG, WebP and Resize | utilities.my',
    h1: 'Image Converter',
    description:
      'Convert images between PNG, JPEG and WebP, resize them and compress them without uploading anything. All the processing happens locally in your browser.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/markdown-previewer',
    title: 'Markdown Previewer — Live Editor and Preview | utilities.my',
    h1: 'Markdown Previewer',
    description:
      'Write Markdown and watch it render live, with GitHub-flavoured tables, footnotes, task lists and code blocks. Export the result as HTML in one click.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/qr-code-generator',
    title: 'QR Code Generator — Free, No Watermark | utilities.my',
    h1: 'QR Code Generator',
    description:
      'Generate a QR code from any text, URL or phone number and download it as a high-resolution PNG. Free, no watermark, no account and no expiry date.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/unix-timestamp-converter',
    title: 'Unix Timestamp Converter — Epoch to Date | utilities.my',
    h1: 'Unix Timestamp Converter',
    description:
      'Convert Unix epoch timestamps to readable dates and back, in seconds or milliseconds and across any timezone. Shows the current epoch time live.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/timezone-converter',
    title: 'Time Zone Converter — Compare Times at a Glance | utilities.my',
    h1: 'Timezone Converter',
    description:
      'Compare a full day across several time zones on one aligned timeline, so you can find a meeting slot that works for everyone without doing the maths.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/world-clock',
    title: 'World Clock — Interactive Globe and Local Times | utilities.my',
    h1: 'World Clock',
    description:
      'Spin an interactive globe or flip to a flat map to see current local times, the day-night terminator and timezone regions anywhere in the world.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/date-diff-calculator',
    title: 'Date Difference Calculator — Days Between Dates | utilities.my',
    h1: 'Date Difference Calculator',
    description:
      'Count the days, weeks, months and years between two dates. Useful for deadlines, notice periods, project planning and working out someone’s exact age.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/text-statistics',
    title: 'Word and Character Counter — Text Statistics | utilities.my',
    h1: 'Text Statistics',
    description:
      'Count words, characters, sentences, paragraphs and estimated reading time as you type. Free, instant and entirely local to your browser.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/sorter',
    title: 'Text Sorter — Sort Lines A-Z or Numerically | utilities.my',
    h1: 'Sorter',
    description:
      'Sort lines of text alphabetically or numerically, reverse the order, and strip duplicates or blank lines. Paste your list, sort it, copy the result.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/spin-the-wheel',
    title: 'Spin the Wheel — Random Picker and Decision Wheel | utilities.my',
    h1: 'Spin the Wheel',
    description:
      'Add your options, spin the wheel and let it pick one at random. Handy for giveaways, drawing a name, or settling where to eat. Free, with no signup.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/morse-code-generator',
    title: 'Morse Code Translator — Text to Morse and Back | utilities.my',
    h1: 'Morse Code Generator',
    description:
      'Translate text into Morse code and decode it back again, then play it as audio, a flashing light or a vibration pattern at an adjustable speed.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/percentage-calculator',
    title: 'Percentage Calculator — Percent Change and More | utilities.my',
    h1: 'Percentage Calculator',
    description:
      'Work out what percent one number is of another, add or subtract a percentage, and calculate the percentage increase or decrease between two values.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/foot-size-converter',
    title: 'Shoe Size Converter — US, UK, EU and CM | utilities.my',
    h1: 'Foot Size Converter',
    description:
      'Convert shoe sizes between US, UK, EU and centimetres, so you can order the right size from any international store without guessing at the chart.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/about',
    title: 'About | utilities.my',
    h1: 'About',
    description:
      'What utilities.my is, who builds it, and the idea behind it: fast, free, privacy-friendly tools that run entirely in your browser with no signup.',
    kind: 'page',
    priority: 0.5,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | utilities.my',
    h1: 'Privacy Policy',
    description:
      'How utilities.my handles your data: the tools run locally in your browser, nothing you type is uploaded, and analytics are limited to anonymous page counts.',
    kind: 'page',
    priority: 0.3,
  },
  {
    path: '/terms',
    title: 'Terms of Service | utilities.my',
    h1: 'Terms of Service',
    description:
      'The terms that apply when you use utilities.my, covering acceptable use, the absence of warranties, and the limits of liability for these free tools.',
    kind: 'page',
    priority: 0.3,
  },
  {
    path: '/settings',
    title: 'Settings | utilities.my',
    h1: 'Settings',
    description:
      'Adjust your preferences for utilities.my, including theme, default units and per-tool defaults. Everything is stored locally in your browser.',
    kind: 'page',
    noindex: true,
  },
  {
    path: '/404',
    title: 'Page Not Found | utilities.my',
    h1: 'Page not found',
    description: 'That page does not exist. Browse the full list of free online tools on utilities.my instead.',
    kind: 'page',
    noindex: true,
  },
]

const byPath = new Map(routes.map((route) => [route.path, route]))

function requireRoute(path: string): RouteSeo {
  const route = byPath.get(path)
  if (!route) throw new Error(`src/lib/seo.ts is missing the '${path}' route`)
  return route
}

const NOT_FOUND = requireRoute('/404')

/** Route metadata for `path`, falling back to the 404 entry for unknown paths. */
export function getRouteSeo(path: string): RouteSeo {
  return byPath.get(path) ?? NOT_FOUND
}

/** Absolute URL for a route, with no trailing slash except on the homepage. */
export function canonicalUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}

/** Absolute URL of the generated OpenGraph card for a route. */
export function ogImageUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/og-image.png` : `${SITE_URL}/og${path}.png`
}

/** Every indexable route, in sitemap order. */
export function indexableRoutes(): RouteSeo[] {
  return routes.filter((route) => !route.noindex && route.priority !== undefined)
}

/**
 * Schema.org graph for a route, as a plain object ready to be JSON-stringified
 * into a <script type="application/ld+json">. Emitted into the prerendered
 * HTML by scripts/build-seo.ts and kept in sync on client-side navigation by
 * <RouteMeta /> (src/components/route-meta.tsx).
 */
export function jsonLdFor(route: RouteSeo): Record<string, unknown> {
  const url = canonicalUrl(route.path)
  const graph: Record<string, unknown>[] = []

  if (route.path === '/') {
    graph.push(
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: route.description,
        inLanguage: 'en',
        publisher: { '@id': `${SITE_URL}/#person` },
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: 'miiyuh',
        url: SITE_URL,
      },
      {
        '@type': 'ItemList',
        name: 'Free online tools on utilities.my',
        itemListElement: routes
          .filter((entry) => entry.kind === 'tool')
          .map((entry, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: entry.h1,
            url: canonicalUrl(entry.path),
          })),
      },
    )
  } else {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: route.h1, item: url },
      ],
    })
  }

  if (route.kind === 'tool') {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      name: route.h1,
      url,
      description: route.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'miiyuh' },
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

/** Value for <meta name="robots">. */
export function robotsContent(route: RouteSeo): string {
  return route.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'
}

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
    title: 'Free online tools that respect your privacy | utilities.my',
    h1: 'Essential utilities for all!',
    description:
      'Converters, calculators, QR codes, a colour picker and more, all free and all running in your browser. Nothing you type is uploaded. Go ahead, use it!',
    kind: 'page',
    priority: 1.0,
  },
  {
    path: '/text-case',
    title: 'Text Case Converter: UPPER, lower, Title Case | utilities.my',
    h1: 'Text Case Converter',
    description:
      'See your text in every case at once, from Sentence case and Title Case to camelCase and snake_case, and copy the one you need. Handles Malay names and acronyms.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/colour-picker',
    title: 'Colour Picker: HEX, RGB, HSL and OKLCH | utilities.my',
    h1: 'Colour Picker',
    description:
      'Pick any colour, or grab one from a photo, and copy it as HEX, RGB, HSL, CMYK or OKLCH. Check its contrast too. All worked out right in your browser.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/unit-converter',
    title: 'Unit Converter: Length, Weight, Temperature | utilities.my',
    h1: 'Unit Converter',
    description:
      'Metres, miles, kilos, pounds, Celsius and Fahrenheit: sorted. Convert length, weight, volume, tyre pressure, calories, fuel economy and more, and see every unit at once.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/bmi-calculator',
    title: 'BMI Calculator: WHO and Asian Cut-offs | utilities.my',
    h1: 'BMI Calculator',
    description:
      'See where your height and weight land on the BMI scale, in metric or imperial, using WHO or Asian (Malaysia CPG) cut-offs. Free and private.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/image-converter',
    title: 'Image Converter: PNG, JPG, WebP and Resize | utilities.my',
    h1: 'Image Converter',
    description:
      "Change a picture's format or size and see exactly how much space you save, before you download. Converts PNG, JPEG and WebP without uploading a thing.",
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/markdown-previewer',
    title: 'Markdown Previewer: Live Editor and Preview | utilities.my',
    h1: 'Markdown Previewer',
    description:
      'Write Markdown and watch it take shape as you type, with tables, task lists and footnotes. Copy it formatted for an email or document, copy the HTML, or download the .md file.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/qr-code-generator',
    title: 'QR Code Generator: Free, No Watermark | utilities.my',
    h1: 'QR Code Generator',
    description:
      'Turn any link, text, Wi-Fi login or phone number into a QR code in seconds. Download a crisp PNG or SVG. No watermark, no account, no expiry.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/unix-timestamp-converter',
    title: 'Unix Timestamp Converter: Epoch to Date | utilities.my',
    h1: 'Unix Timestamp Converter',
    description:
      'Turn long epoch numbers into real dates and back again, in seconds or milliseconds, with the date format you prefer. Free and instant.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/timezone-converter',
    title: 'Timezone Converter: Find a Time for Everyone | utilities.my',
    h1: 'Timezone Converter',
    description:
      'Line up a whole day across several timezones and find a meeting time that works for everyone, wherever they are. No maths required.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/world-clock',
    title: 'World Clock: Interactive Globe and Local Times | utilities.my',
    h1: 'World Clock',
    description:
      "Spin the globe or flip to an Equal Earth map and see what time it is anywhere, where it's day or night, and how the world's timezones fall.",
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/date-diff-calculator',
    title: 'Date Difference Calculator: Days Between Dates | utilities.my',
    h1: 'Date Difference Calculator',
    description:
      'Count the days, weeks, months or years between two dates. Handy for deadlines, notice periods, countdowns and working out an exact age.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/text-statistics',
    title: 'Word and Character Counter: Text Statistics | utilities.my',
    h1: 'Text Statistics',
    description:
      'Count words, characters and reading time as you type, and check your text fits a meta description, an X post or an Instagram caption. Works for Malay and English.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/sorter',
    title: 'Text Sorter: Sort Lines A to Z or by Number | utilities.my',
    h1: 'Sorter',
    description:
      'Put any list in order: A to Z, by number or by length. Remove duplicates, split a comma list into lines or join it back, and undo any step.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/spin-the-wheel',
    title: 'Spin the Wheel: Random Picker | utilities.my',
    h1: 'Spin the Wheel',
    description:
      "Can't decide? Add your options and let the wheel pick for you. Great for giveaways, drawing names or settling where to eat. Free, no signup.",
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/morse-code-generator',
    title: 'Morse Code Translator: Text to Morse and Back | utilities.my',
    h1: 'Morse Code Generator',
    description:
      'Turn messages into dots and dashes and back again, then hear them or watch them flash. Includes a full Morse alphabet reference.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/percentage-calculator',
    title: 'Percentage Calculator: Change, Tips and Discounts | utilities.my',
    h1: 'Percentage Calculator',
    description:
      'Discounts, tips and percentage changes, worked out for you. Find X% of a number, what percent one number is of another, and more.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/foot-size-converter',
    title: 'Shoe Size Converter: UK, EU, US and Foot Length | utilities.my',
    h1: 'Foot Size Converter',
    description:
      'Find your shoe size in UK, EU or US sizes from a size you know or the length of your foot, with a full chart for men, women and kids.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/favicon-generator',
    title: 'Favicon Generator: ICO, PNG, Apple and Android Icons | utilities.my',
    h1: 'Favicon Generator',
    description:
      'Turn a letter, emoji or image into every icon your site needs: favicon.ico, PNGs, Apple touch and Android icons, a manifest and the HTML to paste. Free.',
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/palang-ic',
    title: 'Palang IC: Watermark Your MyKad Copy | utilities.my',
    h1: 'Palang IC',
    description:
      "Make sure your IC copy can't be used for anything else. Stamp its purpose across the front and back, then export an A4 PDF. It never leaves your device.",
    kind: 'tool',
    priority: 0.8,
  },
  {
    path: '/about',
    title: 'About | utilities.my',
    h1: 'About',
    description:
      'Why utilities.my exists, who builds it, and how every tool works, with the formulas and sources behind each one. Free, private and open source.',
    kind: 'page',
    priority: 0.5,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | utilities.my',
    h1: 'Privacy Policy',
    description:
      'Plain-language privacy: everything you put into a tool stays on your device. The only thing collected is anonymous, cookie-free visit statistics.',
    kind: 'page',
    priority: 0.3,
  },
  {
    path: '/terms',
    title: 'Terms of Service | utilities.my',
    h1: 'Terms of Service',
    description:
      'The ground rules for using utilities.my: use the tools freely, double-check anything important, and know that the site comes as-is with no warranty.',
    kind: 'page',
    priority: 0.3,
  },
  {
    path: '/settings',
    title: 'Settings | utilities.my',
    h1: 'Settings',
    description:
      'Make utilities.my yours: choose your theme, units, and date, time and number formats. Saved in your browser, never on a server.',
    kind: 'page',
    noindex: true,
  },
  {
    path: '/404',
    title: 'Page Not Found | utilities.my',
    h1: 'Page not found',
    description:
      "This page doesn't exist, but plenty of useful tools do. Head back to utilities.my and pick one.",
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

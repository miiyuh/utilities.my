/**
 * Post-build SEO step. Runs after `vite build`, under Bun.
 *
 * The app is a client-rendered SPA, so without this every route would serve
 * the same HTML shell: one title, one description, and an empty <div id="root">.
 * Crawlers that do not execute JavaScript would see 23 copies of the homepage.
 *
 * For each route in src/lib/seo.ts this writes dist/<path>/index.html with:
 *   - that route's title, description, canonical, OpenGraph and Twitter tags
 *   - Schema.org JSON-LD
 *   - a static heading, description and tool index seeded inside #root, which
 *     React clears and replaces when it mounts (main.tsx uses createRoot, not
 *     hydrateRoot, so there is no hydration mismatch to worry about)
 *
 * It also emits dist/sitemap.xml, dist/404.html, and a 1200x630 OpenGraph card
 * per route.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Resvg } from '@resvg/resvg-js'

import {
  canonicalUrl,
  indexableRoutes,
  jsonLdFor,
  ogImageUrl,
  robotsContent,
  routes,
  SITE_NAME,
  TWITTER_HANDLE,
  type RouteSeo,
} from '../src/lib/seo'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const FONTS = ['SpaceGrotesk-Bold.ttf', 'SpaceGrotesk-Medium.ttf'].map((file) =>
  join(ROOT, 'scripts', 'assets', file),
)

const SEO_BLOCK = /<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/
const ROOT_BLOCK = /<!-- ROOT:START -->[\s\S]*?<!-- ROOT:END -->/

// Card palette, matching the dark theme in src/globals.css.
const CARD_BG = '#141415'
const CARD_FG = '#f7ece6'
const CARD_ACCENT = '#caa07d'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** The per-route <head> block that replaces the SEO markers in index.html. */
function headFor(route: RouteSeo) {
  const url = canonicalUrl(route.path)
  const image = ogImageUrl(route.path)
  const title = escapeHtml(route.title)
  const description = escapeHtml(route.description)

  return [
    '<!-- SEO:START -->',
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${robotsContent(route)}" />`,
    // No canonical on noindex routes: /404 is a synthetic path that would
    // point at a URL which itself returns 404.
    ...(route.noindex ? [] : [`<link rel="canonical" href="${url}" />`]),
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="en_US" />',
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeHtml(`${route.h1} — ${SITE_NAME}`)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:site" content="${TWITTER_HANDLE}" />`,
    `<meta name="twitter:creator" content="${TWITTER_HANDLE}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json" data-route-schema>${JSON.stringify(jsonLdFor(route)).replace(/</g, '\\u003c')}</script>`,
    '<!-- SEO:END -->',
  ]
    .map((line, index) => (index === 0 ? line : `    ${line}`))
    .join('\n')
}

/**
 * Static content seeded into #root. React clears the container on mount, so
 * this is what non-JavaScript crawlers read: the route's heading, its
 * description, and links to every tool for internal link equity.
 */
function bodyFor(route: RouteSeo) {
  const tools = routes.filter((entry) => entry.kind === 'tool' && entry.path !== route.path)
  const links = tools
    .map((tool) => `<li><a href="${tool.path}">${escapeHtml(tool.h1)}</a></li>`)
    .join('')

  return [
    '<!-- ROOT:START --><div id="root">',
    '      <div id="prerendered-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;">',
    `        <h1>${escapeHtml(route.h1)}</h1>`,
    `        <p>${escapeHtml(route.description)}</p>`,
    '        <nav aria-label="All tools">',
    `          <h2>All tools on ${SITE_NAME}</h2>`,
    `          <ul>${route.path === '/' ? '' : '<li><a href="/">Home</a></li>'}${links}</ul>`,
    '        </nav>',
    '      </div>',
    '    </div>',
  ].join('\n')
}

function pageFor(shell: string, route: RouteSeo) {
  if (!SEO_BLOCK.test(shell)) {
    throw new Error('index.html is missing its <!-- SEO:START --> / <!-- SEO:END --> markers')
  }
  if (!ROOT_BLOCK.test(shell)) {
    throw new Error('index.html is missing its <!-- ROOT:START --> / <!-- ROOT:END --> markers')
  }
  return shell.replace(SEO_BLOCK, headFor(route)).replace(ROOT_BLOCK, bodyFor(route))
}

function sitemap(lastmod: string) {
  const urls = indexableRoutes()
    .map((route) =>
      [
        '  <url>',
        `    <loc>${canonicalUrl(route.path)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${route.path === '/' ? 'weekly' : 'monthly'}</changefreq>`,
        `    <priority>${route.priority!.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n'),
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/**
 * Wraps `text` to at most `max` characters per line at word boundaries, and to
 * at most `maxLines` lines. A line dropped by that limit is marked with an
 * ellipsis so the card never ends mid-sentence.
 */
function wrap(text: string, max: number, maxLines = Number.POSITIVE_INFINITY) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > max && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines

  const kept = lines.slice(0, maxLines)
  const last = kept[maxLines - 1].replace(/[,;:.]$/, '')
  kept[maxLines - 1] = `${last}…`
  return kept
}

function cardSvg(route: RouteSeo) {
  const isHome = route.path === '/'
  const heading = isHome ? SITE_NAME : route.h1
  const headingLines = wrap(heading, 22)
  const fontSize = headingLines.length > 1 ? 86 : 104
  const lineHeight = fontSize * 1.12
  const headingTop = 300 - ((headingLines.length - 1) * lineHeight) / 2

  const subtitle = wrap(isHome ? 'Free online tools. No signup, no tracking.' : route.description, 58, 2)
  const subtitleTop = headingTop + (headingLines.length - 1) * lineHeight + 92

  const headingTspans = headingLines
    .map((line, index) => `<tspan x="80" y="${headingTop + index * lineHeight}">${escapeHtml(line)}</tspan>`)
    .join('')
  const subtitleTspans = subtitle
    .map((line, index) => `<tspan x="80" y="${subtitleTop + index * 44}">${escapeHtml(line)}</tspan>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${CARD_BG}"/>
  <rect x="0" y="0" width="1200" height="10" fill="${CARD_ACCENT}"/>
  <circle cx="1080" cy="520" r="220" fill="${CARD_ACCENT}" opacity="0.10"/>
  <text x="80" y="118" font-family="Space Grotesk" font-size="30" font-weight="500" fill="${CARD_ACCENT}" letter-spacing="3">${escapeHtml(SITE_NAME.toUpperCase())}</text>
  <text font-family="Space Grotesk" font-size="${fontSize}" font-weight="700" fill="${CARD_FG}">${headingTspans}</text>
  <text font-family="Space Grotesk" font-size="32" font-weight="400" fill="${CARD_FG}" opacity="0.72">${subtitleTspans}</text>
  <text x="80" y="562" font-family="Space Grotesk" font-size="28" font-weight="500" fill="${CARD_ACCENT}">${escapeHtml(canonicalUrl(route.path).replace('https://', ''))}</text>
</svg>`
}

function renderCard(route: RouteSeo) {
  const resvg = new Resvg(cardSvg(route), {
    background: CARD_BG,
    fitTo: { mode: 'width', value: 1200 },
    // Ship the font with the repo rather than relying on whatever the build
    // machine happens to have installed.
    font: { fontFiles: FONTS, defaultFontFamily: 'Space Grotesk', loadSystemFonts: false },
  })
  return resvg.render().asPng()
}

async function main() {
  if (!existsSync(DIST)) {
    throw new Error('dist/ not found — run `vite build` before this script')
  }

  // A tool added to src/lib/tools.ts but not to src/lib/seo.ts would silently
  // drop out of the sitemap and 404 in production (there is no SPA fallback
  // rewrite any more), so fail the build instead. tools.ts is read as text to
  // keep this script free of React and phosphor-react imports.
  const toolsSource = await readFile(join(ROOT, 'src', 'lib', 'tools.ts'), 'utf8')
  const declared = new Set(routes.map((route) => route.path))
  const missing = [...toolsSource.matchAll(/path:\s*"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !declared.has(path))
  if (missing.length > 0) {
    throw new Error(`src/lib/tools.ts has routes missing from src/lib/seo.ts: ${missing.join(', ')}`)
  }

  const shell = await readFile(join(DIST, 'index.html'), 'utf8')
  const lastmod = new Date().toISOString().slice(0, 10)

  await Promise.all(
    routes.map(async (route) => {
      const html = pageFor(shell, route)
      if (route.path === '/') {
        return writeFile(join(DIST, 'index.html'), html)
      }
      if (route.path === '/404') {
        // Vercel serves dist/404.html with a real 404 status for unknown paths.
        return writeFile(join(DIST, '404.html'), html)
      }
      const dir = join(DIST, route.path)
      await mkdir(dir, { recursive: true })
      return writeFile(join(dir, 'index.html'), html)
    }),
  )

  await writeFile(join(DIST, 'sitemap.xml'), sitemap(lastmod))

  await mkdir(join(DIST, 'og'), { recursive: true })
  await Promise.all(
    routes.map((route) => {
      const png = renderCard(route)
      const target = route.path === '/' ? join(DIST, 'og-image.png') : join(DIST, 'og', `${route.path.slice(1)}.png`)
      return writeFile(target, png)
    }),
  )

  const written = await readdir(DIST)
  console.log(
    `[build-seo] ${routes.length} routes prerendered, ${indexableRoutes().length} in sitemap.xml, ` +
      `${routes.length} OpenGraph cards. dist/ has ${written.length} top-level entries.`,
  )
}

await main()

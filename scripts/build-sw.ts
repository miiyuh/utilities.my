/**
 * Post-build offline step. Runs after `vite build` and build-seo, under Bun.
 *
 * Writes dist/sw.js from scripts/sw-template.js, with the list of files to
 * store on install (every page, the app's code, fonts, icons and data) and a
 * version that changes whenever any of those files does, so a new deploy
 * installs as an update.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { routes } from '../src/lib/seo'

/** A warning past this: everything here downloads on the first visit, and one failed file fails the install. */
const BUDGET_BYTES = 8 * 1024 * 1024

/** Single files outside the folders below that the app uses. */
const ROOT_FILES = new Set(['/manifest.json', '/favicon.ico', '/apple-touch-icon.png'])

export interface SwManifest {
  version: string
  /** Page URLs, such as "/" and "/image-converter". */
  pages: string[]
  /** Files stored on install. */
  files: string[]
  /** Every file under /_static, so stored copies of files a newer build dropped can be cleared. */
  known: string[]
}

/** Which built files to store on install, from every file in dist/ (as URL paths) and the routes. */
export function planPrecache(files: string[], routePaths: string[]): Omit<SwManifest, 'version'> {
  // The 404 page answers with a 404 status, which would make the whole install fail.
  const pages = routePaths.filter((p) => p !== '/404')
  const stored = files.filter(
    (f) =>
      // The app's code, styles and fonts. Source maps, the older WOFF fonts and
      // the large AVIF and JPEG XL encoders are left for when they're needed.
      /^\/_static\/[^/]+\.(js|css|woff2)$/.test(f) || /^\/(data|icons|assets)\//.test(f) || ROOT_FILES.has(f)
  )
  const known = files.filter((f) => f.startsWith('/_static/') && !f.endsWith('.map'))
  return { pages, files: stored.toSorted(), known: known.toSorted() }
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : Promise.resolve([join(dir, e.name)])))
  )
  return nested.flat()
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const dist = join(root, 'dist')
  const toUrl = (file: string) => `/${relative(dist, file).split(sep).join('/')}`
  const pageFile = (path: string) => join(dist, path === '/' ? 'index.html' : join(path.slice(1), 'index.html'))

  const all = (await walk(dist)).map(toUrl)
  const plan = planPrecache(all, routes.map((r) => r.path))

  // The version is a hash of everything stored, so any change makes a new one.
  const stored = [
    ...plan.pages.map((page) => ({ url: page, path: pageFile(page) })),
    ...plan.files.map((file) => ({ url: file, path: join(dist, file.slice(1)) })),
  ]
  const contents = await Promise.all(stored.map((s) => readFile(s.path)))
  const hash = createHash('sha256')
  stored.forEach((s, i) => hash.update(s.url).update(contents[i]))
  const manifest: SwManifest = { version: hash.digest('hex').slice(0, 12), ...plan }

  const template = await readFile(join(root, 'scripts', 'sw-template.js'), 'utf8')
  // A function, so nothing in the JSON is read as a replacement pattern such as "$&".
  const sw = template.replace('self.__SW_MANIFEST__', () => JSON.stringify(manifest))
  if (sw === template) throw new Error('scripts/sw-template.js has no self.__SW_MANIFEST__ to fill in')
  await writeFile(join(dist, 'sw.js'), sw)

  const bytes = contents.reduce((n, b) => n + b.length, 0)
  if (bytes > BUDGET_BYTES) {
    console.warn(
      `[build-sw] Warning: ${(bytes / 1024 / 1024).toFixed(1)} MB is stored on the first visit, over the ` +
        `${BUDGET_BYTES / 1024 / 1024} MB budget. Check what planPrecache picks up.`
    )
  }
  console.log(
    `[build-sw] sw.js version ${manifest.version}: ${plan.pages.length} pages and ${plan.files.length} files ` +
      `(${(bytes / 1024 / 1024).toFixed(1)} MB with the pages) stored for offline use.`
  )
}

if (import.meta.main) await main()

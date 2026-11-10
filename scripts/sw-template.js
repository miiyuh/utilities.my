// utilities.my service worker: makes the site work offline after one visit.
// scripts/build-sw.ts writes this file to dist/sw.js after the build, with
// the file list below filled in. Only the site's own files are stored, never
// anything a person types, drops in or makes.

/** @type {{ version: string, pages: string[], files: string[], known: string[] }} */
const MANIFEST = self.__SW_MANIFEST__

/** Everything one build needs offline, stored together on install. */
const PRECACHE = `utilities-${MANIFEST.version}`
/** Files stored the first time they're used: the AVIF and JPEG XL encoders, and the city time zone list. */
const RUNTIME = 'utilities-runtime'
/** After this long without an answer, a stored page is shown instead of waiting. */
const PAGE_TIMEOUT_MS = 3000

const PAGES = new Set(MANIFEST.pages)
const FILES = new Set(MANIFEST.files)
const KNOWN = new Set(MANIFEST.known)

self.addEventListener('install', (event) => {
  // `reload` skips the browser's HTTP cache, so a new build never stores an old file.
  const urls = [...PAGES, ...FILES].map((url) => new Request(url, { cache: 'reload' }))
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll(urls)))
  // An update waits until the page asks for it (see the message handler), so a
  // new version never replaces the old one in the middle of someone's work.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith('utilities-') && name !== PRECACHE && name !== RUNTIME) await caches.delete(name)
      }
      // Stored copies of files this build no longer has, such as an older encoder.
      const runtime = await caches.open(RUNTIME)
      for (const request of await runtime.keys()) {
        const url = new URL(request.url)
        if (url.origin === self.location.origin && !KNOWN.has(url.pathname)) await runtime.delete(request)
      }
      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skip-waiting') void self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') event.respondWith(page(request, url))
    else if (FILES.has(url.pathname) || (url.pathname.startsWith('/_static/') && !url.pathname.endsWith('.map')))
      event.respondWith(storedFirst(request))
    return
  }

  // The World Clock's city time zone list: show the stored copy, and refresh it.
  if (url.origin === 'https://raw.githubusercontent.com') event.respondWith(storedThenRefresh(request))
})

/** Pages come from the network when it answers in time, and from storage when it doesn't. */
async function page(request, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const cache = await caches.open(PRECACHE)
  // Every page runs the same app, which draws the right route, so home stands in for a page that isn't stored.
  const stored = (await cache.match(PAGES.has(path) ? path : '/')) ?? null
  const network = fetch(request)
  if (!stored) return network
  network.catch(() => undefined)
  try {
    return await Promise.race([network, wait(PAGE_TIMEOUT_MS).then(() => stored)])
  } catch {
    return stored
  }
}

/** Hashed files never change, so a stored copy is always right. */
async function storedFirst(request) {
  const hit = await caches.match(request, { ignoreSearch: true })
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) {
    const runtime = await caches.open(RUNTIME)
    await runtime.put(request, response.clone())
  }
  return response
}

async function storedThenRefresh(request) {
  const runtime = await caches.open(RUNTIME)
  const hit = await runtime.match(request)
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) void runtime.put(request, response.clone())
      return response
    })
    .catch(() => hit ?? Response.error())
  return hit ?? refresh
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

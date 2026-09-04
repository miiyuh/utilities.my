import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  canonicalUrl,
  getRouteSeo,
  jsonLdFor,
  ogImageUrl,
  robotsContent,
  SITE_NAME,
  TWITTER_HANDLE,
} from '@/lib/seo'

/**
 * Keeps the document head in sync with the current route.
 *
 * scripts/build-seo.ts already bakes the correct tags into each prerendered
 * HTML file, so this is only doing work after a client-side navigation. It
 * updates the existing nodes in place rather than appending new ones, which is
 * why there is no <Helmet> here: a head manager that appends its own copies
 * would leave two of every tag next to the prerendered ones.
 *
 * Mounted once, inside the router, in src/App.tsx.
 */
export function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const route = getRouteSeo(pathname)
    const url = canonicalUrl(route.path)
    const image = ogImageUrl(route.path)

    document.title = route.title

    upsertMeta('name', 'description', route.description)
    upsertMeta('name', 'robots', robotsContent(route))
    // Noindex routes get no canonical. Removing rather than skipping matters on
    // client-side navigation: leaving the previous route's tag in place would
    // point /settings at whatever page the user came from.
    if (route.noindex) removeLink('canonical')
    else upsertLink('canonical', url)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:locale', 'en_US')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', route.title)
    upsertMeta('property', 'og:description', route.description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', image)
    upsertMeta('property', 'og:image:width', '1200')
    upsertMeta('property', 'og:image:height', '630')
    upsertMeta('property', 'og:image:alt', `${route.h1} — ${SITE_NAME}`)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:site', TWITTER_HANDLE)
    upsertMeta('name', 'twitter:creator', TWITTER_HANDLE)
    upsertMeta('name', 'twitter:title', route.title)
    upsertMeta('name', 'twitter:description', route.description)
    upsertMeta('name', 'twitter:image', image)

    upsertJsonLd(jsonLdFor(route))
  }, [pathname])

  return null
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function removeLink(rel: string) {
  document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)?.remove()
}

function upsertJsonLd(payload: Record<string, unknown>) {
  let element = document.head.querySelector<HTMLScriptElement>('script[data-route-schema]')
  if (!element) {
    element = document.createElement('script')
    element.type = 'application/ld+json'
    element.dataset.routeSchema = ''
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(payload)
}

import { describe, expect, test } from 'bun:test'
import { planPrecache } from './build-sw'

const files = [
  '/index.html',
  '/404.html',
  '/sw.js',
  '/manifest.json',
  '/favicon.ico',
  '/og-image.png',
  '/og/image-converter.png',
  '/sitemap.xml',
  '/data/emoji.json',
  '/icons/icon-192x192.png',
  '/assets/img/logo.svg',
  '/_static/index-abc.js',
  '/_static/index-abc.js.map',
  '/_static/index-abc.css',
  '/_static/inter-latin-abc.woff2',
  '/_static/inter-latin-abc.woff',
  '/_static/avif_enc-abc.wasm',
]

describe('planPrecache', () => {
  const plan = planPrecache(files, ['/', '/image-converter', '/404'])

  test('stores every page except the 404 page, which answers with an error status', () => {
    expect(plan.pages).toEqual(['/', '/image-converter'])
  })

  test('stores the app, fonts, icons and data, and leaves out maps, encoders and share images', () => {
    expect(plan.files).toEqual([
      '/_static/index-abc.css',
      '/_static/index-abc.js',
      '/_static/inter-latin-abc.woff2',
      '/assets/img/logo.svg',
      '/data/emoji.json',
      '/favicon.ico',
      '/icons/icon-192x192.png',
      '/manifest.json',
    ])
  })

  test('knows every static file but the maps, so old stored copies can be cleared', () => {
    expect(plan.known).toContain('/_static/avif_enc-abc.wasm')
    expect(plan.known).not.toContain('/_static/index-abc.js.map')
  })
})

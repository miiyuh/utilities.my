import type { MetadataRoute } from 'next';

// If routes grow dynamic, this can be generated from a list.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://utilities.my';
  const now = new Date().toISOString();
  const pages = [
    '/',
    '/about',
    '/privacy',
    '/terms',
    '/bmi-calculator',
    '/qr-code-generator',
    '/timezone-converter',
    '/unit-converter',
    '/unix-timestamp-converter',
    '/date-diff-calculator',
    '/markdown-previewer',
    '/color-picker',
    '/sorter',
    '/spin-the-wheel',
    '/text-case',
    '/text-statistics',
    '/settings',
  ];
  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.6,
  }));
}

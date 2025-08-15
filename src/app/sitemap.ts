import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://utilities.my';
  // Static pages list; can be expanded dynamically if needed
  const routes = [
    '',
    '/about',
    '/privacy',
    '/terms',
    '/settings',
    '/bmi-calculator',
    '/qr-code-generator',
    '/color-picker',
    '/date-diff-calculator',
    '/markdown-previewer',
    '/sorter',
    '/spin-the-wheel',
    '/text-case',
    '/text-statistics',
    '/timezone-converter',
    '/unit-converter',
    '/unix-timestamp-converter',
  ];
  const now = new Date();
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1.0 : 0.7,
  }));
}

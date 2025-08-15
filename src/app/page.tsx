import type { Metadata } from 'next';
import HomeClient from './_components/home';

export const metadata: Metadata = {
  title: 'utilities.my',
  description: 'A fast, privacy-friendly collection of useful, everyday web tools: converters, generators, calculators, and more.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'utilities.my',
    url: 'https://utilities.my/',
    images: [{ url: '/api/og?title=utilities.my&subtitle=Handy%20tools%20for%20everyday%20tasks', width: 1200, height: 630 }],
  },
};

export default function Home() {
  // Server Component wrapper to enable metadata export
  return <HomeClient />;
}

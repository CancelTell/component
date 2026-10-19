import type { NextConfig } from 'next';
import { readFileSync } from 'node:fs';

/** Read once at build time: the browser needs to know whether real prices exist without loading them */
function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}
const offers = readJson<{ offers?: Record<string, unknown> }>('data/offers.json', {});
const catalog = readJson<{ generatedAt?: string }>('data/catalog.json', {});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_HAS_PRICES: Object.keys(offers.offers ?? {}).length > 0 ? '1' : '0',
    NEXT_PUBLIC_CATALOG_DATE: catalog.generatedAt ?? '',
  },
  experimental: {
    // Tree-shake the icon set so only used icons end up in the bundle
    optimizePackageImports: ['lucide-react'],
  },
  async redirects() {
    return [
      // Old names: the builder used to be «Сочетаемость», saved builds — «Корзина»
      { source: '/compatibility', destination: '/build', permanent: true },
      { source: '/cart', destination: '/builds', permanent: true },
    ];
  },
};

export default nextConfig;

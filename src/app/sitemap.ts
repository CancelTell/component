import type { MetadataRoute } from 'next';
import { categories, products } from '@/data';
import { productHref } from '@/lib/catalog';
import { siteConfig } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteConfig.url).toString();
  return [
    { url: url('/'), changeFrequency: 'weekly', priority: 1 },
    { url: url('/catalog'), changeFrequency: 'weekly', priority: 0.8 },
    { url: url('/compatibility'), changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/guide'), changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/about'), changeFrequency: 'yearly', priority: 0.3 },
    ...categories.map((c) => ({ url: url(`/catalog/${c.id}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.map((p) => ({ url: url(productHref(p)), changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}

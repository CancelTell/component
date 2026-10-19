import { categoryById } from '@/data/categories';
import type { Product } from '@/data/types';
import type { SearchEntry } from './catalog-fetch';
import { productSummary } from './catalog';

export const normalizeQuery = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

/** Search entry of a product: what /data/search.json holds for the header search */
export function toSearchEntry(product: Product): SearchEntry {
  const config = categoryById[product.category];
  const specs = Object.values(product.specs)
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v): v is string => typeof v === 'string');
  return {
    slug: product.slug,
    category: product.category,
    brand: product.brand,
    name: product.name,
    summary: productSummary(product),
    text: normalizeQuery([product.brand, product.name, config.name, config.singular, ...new Set(specs)].join(' ')),
    popularity: product.popularity,
  };
}

/**
 * Token search: every word of the query must occur in the entry text.
 * Ranking: whole-word match in the model name > word prefix > substring > match only in specs.
 */
export function searchEntries<T extends SearchEntry>(entries: T[], query: string): T[] {
  const tokens = normalizeQuery(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];
  return entries
    .filter((e) => tokens.every((t) => e.text.includes(t)))
    .map((e) => {
      const name = normalizeQuery(`${e.brand} ${e.name}`);
      const words = name.split(' ');
      const score = tokens.reduce((acc, t) => {
        if (words.includes(t)) return acc + 4;
        if (words.some((w) => w.startsWith(t))) return acc + 3;
        if (name.includes(t)) return acc + 2;
        return acc + 1;
      }, 0);
      return { e, score };
    })
    .sort((a, b) => b.score - a.score || a.e.popularity - b.e.popularity)
    .map((r) => r.e);
}

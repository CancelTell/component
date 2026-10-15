import { categoryById, products } from '@/data';
import type { Product } from '@/data/types';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

function haystack(product: Product): string {
  const specs = Object.values(product.specs)
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v): v is string => typeof v === 'string');
  return normalize(
    [product.brand, product.name, categoryById[product.category].name, categoryById[product.category].singular, ...specs].join(' '),
  );
}

const index = products.map((p) => {
  const name = normalize(`${p.brand} ${p.name}`);
  return { product: p, text: haystack(p), name, words: name.split(' ') };
});

/**
 * Token search: every word of the query must occur in the product text.
 * Ranking: whole-word match in the model name > word prefix > substring > match only in specs.
 */
export function searchProducts(query: string): Product[] {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];
  return index
    .filter((entry) => tokens.every((t) => entry.text.includes(t)))
    .map((entry) => ({
      product: entry.product,
      score: tokens.reduce((acc, t) => {
        if (entry.words.includes(t)) return acc + 4;
        if (entry.words.some((w) => w.startsWith(t))) return acc + 3;
        if (entry.name.includes(t)) return acc + 2;
        return acc + 1;
      }, 0),
    }))
    .sort((a, b) => b.score - a.score || a.product.popularity - b.product.popularity)
    .map((r) => r.product);
}

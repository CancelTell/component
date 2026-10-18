import type { Product } from '../../src/data/types';
import { categoryOf, cleanName, gpuChip } from './normalize';
import type { FeedOffer } from './sources';
import { slugify, tokens } from './util';

/** Lookup tables to find which catalog model a store offer belongs to */
export function buildIndex(products: Product[]) {
  const byEan = new Map<string, Product>();
  const byMpn = new Map<string, Product>();
  const bySlug = new Map<string, Product>();
  for (const p of products) {
    bySlug.set(p.slug, p);
    p.ids?.ean?.forEach((e) => byEan.set(e, p));
    p.ids?.mpn?.forEach((m) => byMpn.set(m, p));
  }
  const words = products.map((p) => ({ p, words: tokens(`${p.brand} ${p.name}`) }));
  return { byEan, byMpn, bySlug, words };
}
export type CatalogIndex = ReturnType<typeof buildIndex>;

/**
 * Exact identifiers first (barcode, part number); video cards by chip;
 * otherwise every word of the model name must appear in the offer title — the longest such name wins,
 * so "B650 TOMAHAWK WIFI" beats "B650 TOMAHAWK".
 */
export function matchOffer(offer: FeedOffer, index: CatalogIndex): Product | null {
  const category = categoryOf(offer.category);
  if (!category) return null;
  for (const e of offer.eans) {
    const p = index.byEan.get(e);
    if (p) return p;
  }
  if (offer.mpn) {
    const p = index.byMpn.get(offer.mpn);
    if (p) return p;
  }
  if (category === 'gpu') {
    const chip = gpuChip(offer.title);
    return chip ? (index.bySlug.get(slugify(`${chip.brand} ${chip.name}`)) ?? null) : null;
  }
  const title = new Set(tokens(`${offer.vendor} ${offer.title} ${offer.mpn}`));
  let best: Product | null = null;
  let bestLen = 0;
  for (const { p, words } of index.words) {
    if (p.category !== category || words.length <= bestLen) continue;
    if (words.every((w) => title.has(w))) {
      best = p;
      bestLen = words.length;
    }
  }
  return best;
}

/** Identity of an offer for grouping offers of the same model across stores */
export function offerKey(offer: FeedOffer): string {
  const category = categoryOf(offer.category) ?? 'other';
  if (category === 'gpu') {
    const chip = gpuChip(offer.title);
    if (chip) return `gpu:${slugify(chip.name)}`;
  }
  if (offer.eans[0]) return `ean:${offer.eans[0]}`;
  if (offer.mpn) return `mpn:${slugify(offer.vendor)}:${offer.mpn}`;
  return `name:${category}:${slugify(`${offer.vendor} ${cleanName(offer.title, offer.vendor)}`)}`;
}

/**
 * Store offers, keyed by product slug. SERVER ONLY: client code gets offers per category
 * through src/lib/catalog-client.ts, so the file never lands in the JS bundle.
 * Real prices come from data/offers.json, written by `npm run data:prices` (scripts/pipeline).
 * Until store feeds are connected the file is empty and the site shows no prices at all.
 */
import offersFile from '../../data/offers.json';
import type { Offer } from './types';

export type { Offer };

export const offersBySlug = (offersFile as unknown as { offers: Record<string, Offer[]> }).offers;

/** true once at least one store feed is connected */
export const HAS_PRICES = Object.keys(offersBySlug).length > 0;

export function getOffers(slug: string): Offer[] {
  return [...(offersBySlug[slug] ?? [])].sort(
    (a, b) => Number(b.inStock) - Number(a.inStock) || (a.price ?? Infinity) - (b.price ?? Infinity),
  );
}

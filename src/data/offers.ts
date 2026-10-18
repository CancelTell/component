/**
 * Store availability, keyed by product slug.
 * Real prices come from data/offers.json, written by `npm run data:prices` (scripts/pipeline)
 * on a schedule. Until store feeds are connected that file is empty and the site shows demo prices.
 */
import offersFile from '../../data/offers.json';
import type { StoreId } from './stores';
import { buildDemoOffers } from './demo-offers';

export interface Offer {
  /** Store name as shown to the user */
  store: string;
  storeId: StoreId;
  /** Price in roubles; null when the store doesn't show it */
  price: number | null;
  inStock: boolean;
  /** Link to the product in the store */
  url: string;
  /** ISO date of the last update */
  updatedAt: string;
}

const realOffers = (offersFile as unknown as { offers: Record<string, Offer[]> }).offers;

/** true while there are no real store prices yet — the UI shows a «демо» note */
export const OFFERS_ARE_DEMO = Object.keys(realOffers).length === 0;

export const offersBySlug: Record<string, Offer[]> = OFFERS_ARE_DEMO ? buildDemoOffers() : realOffers;

export function getOffers(slug: string): Offer[] {
  return [...(offersBySlug[slug] ?? [])].sort(
    (a, b) => Number(b.inStock) - Number(a.inStock) || (a.price ?? Infinity) - (b.price ?? Infinity),
  );
}

/** Cheapest in-stock offer */
export function bestOffer(slug: string): Offer | null {
  return getOffers(slug).find((o) => o.inStock && o.price !== null) ?? null;
}

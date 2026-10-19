'use client';

/**
 * Catalog data in the browser, loaded per category on demand.
 *
 * The full catalog never goes into the JS bundle: pages that are rendered on the server pass
 * their own category in props (and prime this cache), everything else — the builder, saved builds,
 * comparison — fetches /data/<category>.json when it needs it. Files are static and cached by the CDN.
 */
import { useEffect, useSyncExternalStore } from 'react';
import type { CategoryId, CategoryPayload, Offer, Product } from '@/data/types';
import { fetchCategory } from '@/lib/catalog-fetch';

const loaded = new Map<CategoryId, CategoryPayload>();
const inflight = new Map<CategoryId, Promise<void>>();
const bySlug = new Map<string, Product>();
const listeners = new Set<() => void>();
let version = 0;

const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

function put(category: CategoryId, payload: CategoryPayload) {
  loaded.set(category, payload);
  for (const p of payload.products) bySlug.set(p.slug, p);
}

/** Server-rendered pages hand their data over so nothing is fetched twice. Safe to call in render. */
export function primeCategory(category: CategoryId, payload: CategoryPayload) {
  if (!loaded.has(category)) put(category, payload);
}

export function ensureCategories(categories: readonly CategoryId[]): Promise<void> {
  const jobs = [...new Set(categories)].map((c) => {
    if (loaded.has(c)) return Promise.resolve();
    let job = inflight.get(c);
    if (!job) {
      job = fetchCategory(c)
        .then((payload) => {
          put(c, payload);
          emit();
        })
        .catch(() => {
          // Network error: allow a retry on the next call
        })
        .finally(() => inflight.delete(c));
      inflight.set(c, job);
    }
    return job;
  });
  return Promise.all(jobs).then(() => undefined);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Loads the categories and re-renders when they arrive. Returns true once all of them are here. */
export function useCatalog(categories: readonly CategoryId[]): boolean {
  useSyncExternalStore(subscribe, () => version, () => 0);
  const key = [...new Set(categories)].sort().join(',');
  useEffect(() => {
    if (key) void ensureCategories(key.split(',') as CategoryId[]);
  }, [key]);
  return categories.every((c) => loaded.has(c));
}

export const isLoaded = (category: CategoryId) => loaded.has(category);
export const getProduct = (slug: string): Product | undefined => bySlug.get(slug);

export function getCategoryProducts(category: CategoryId): Product[] {
  return loaded.get(category)?.products ?? [];
}

function offersOf(slug: string): Offer[] {
  const p = bySlug.get(slug);
  return (p && loaded.get(p.category)?.offers[slug]) || [];
}

/** In-stock offers first, then cheaper first */
export function getOffers(slug: string): Offer[] {
  return [...offersOf(slug)].sort(
    (a, b) => Number(b.inStock) - Number(a.inStock) || (a.price ?? Infinity) - (b.price ?? Infinity),
  );
}

/** Cheapest in-stock offer */
export function bestOffer(slug: string): Offer | null {
  let best: Offer | null = null;
  for (const o of offersOf(slug)) {
    if (!o.inStock || o.price === null) continue;
    if (!best || o.price < best.price!) best = o;
  }
  return best;
}

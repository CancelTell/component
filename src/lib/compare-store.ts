'use client';

import type { CategoryId, Product } from '@/data/types';
import { getProduct, useCatalog } from './catalog-client';
import { createPersistentStore } from './store';

export const COMPARE_LIMIT = 4;

interface Entry {
  slug: string;
  category: CategoryId;
}

/** Entries keep the category, so the page knows which data to load without the whole catalog */
const store = createPersistentStore<Entry[]>('component:compare-v2', []);

/** Counts and toggles only: does not load any data (header, catalog buttons) */
export function useCompareList() {
  const entries = store.useStore();
  const inCategory = (category: CategoryId) => entries.filter((e) => e.category === category);
  const has = (slug: string) => entries.some((e) => e.slug === slug);
  const isFull = (category: CategoryId) => inCategory(category).length >= COMPARE_LIMIT;

  const add = (product: Pick<Product, 'slug' | 'category'>) =>
    store.set((prev) => {
      if (prev.some((e) => e.slug === product.slug)) return prev;
      if (prev.filter((e) => e.category === product.category).length >= COMPARE_LIMIT) return prev;
      return [...prev, { slug: product.slug, category: product.category }];
    });
  const remove = (slug: string) => store.set((prev) => prev.filter((e) => e.slug !== slug));
  const toggle = (product: Pick<Product, 'slug' | 'category'>) => (has(product.slug) ? remove(product.slug) : add(product));
  const clear = (category?: CategoryId) => store.set((prev) => (category ? prev.filter((e) => e.category !== category) : []));

  return { entries, count: entries.length, has, add, remove, toggle, clear, inCategory, isFull };
}

/** Same plus the products themselves, loaded per category (comparison page, comparison bar) */
export function useCompare() {
  const list = useCompareList();
  const ready = useCatalog(list.entries.map((e) => e.category));
  const items = list.entries.map((e) => getProduct(e.slug)).filter((p): p is Product => !!p);
  return { ...list, items, ready, inCategoryItems: (c: CategoryId) => items.filter((p) => p.category === c) };
}

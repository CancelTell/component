'use client';

import { getProduct } from '@/data';
import type { CategoryId, Product } from '@/data/types';
import { createPersistentStore } from './store';

export const COMPARE_LIMIT = 4;

const store = createPersistentStore<string[]>('component:compare', []);

export function useCompare() {
  const slugs = store.useStore();
  const items = slugs.map(getProduct).filter((p): p is Product => !!p);

  const inCategory = (category: CategoryId) => items.filter((p) => p.category === category);
  const has = (slug: string) => slugs.includes(slug);
  const isFull = (category: CategoryId) => inCategory(category).length >= COMPARE_LIMIT;

  const add = (product: Product) =>
    store.set((prev) => {
      if (prev.includes(product.slug)) return prev;
      const sameCategory = prev.filter((s) => getProduct(s)?.category === product.category);
      if (sameCategory.length >= COMPARE_LIMIT) return prev;
      return [...prev, product.slug];
    });

  const remove = (slug: string) => store.set((prev) => prev.filter((s) => s !== slug));

  const toggle = (product: Product) => (has(product.slug) ? remove(product.slug) : add(product));

  const clear = (category?: CategoryId) =>
    store.set((prev) => (category ? prev.filter((s) => getProduct(s)?.category !== category) : []));

  return { items, count: items.length, has, add, remove, toggle, clear, inCategory, isFull };
}

'use client';

import { getProduct } from '@/data';
import type { Product } from '@/data/types';
import type { Build, SlotId } from './compatibility';
import { createPersistentStore } from './store';

const store = createPersistentStore<Partial<Record<SlotId, string>>>('component:build', {});

export function useBuild() {
  const slugs = store.useStore();

  const build: Build = {};
  for (const [slot, slug] of Object.entries(slugs) as Array<[SlotId, string]>) {
    const product = getProduct(slug);
    if (product) build[slot] = product;
  }

  const select = (slot: SlotId, product: Product) => store.set((prev) => ({ ...prev, [slot]: product.slug }));
  const clearSlot = (slot: SlotId) =>
    store.set((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  const reset = () => store.set({});

  return { build, select, clearSlot, reset };
}

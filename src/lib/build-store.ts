'use client';

import { useEffect } from 'react';
import type { Product } from '@/data/types';
import { buildCategories, buildSlots, slotCategory, type Build, type BuildSlugs, type SlotId } from './compatibility';
import { getProduct, useCatalog } from './catalog-client';
import { createPersistentStore } from './store';

/** The build open in the constructor */
const store = createPersistentStore<BuildSlugs>('component:build', {});

/** Slugs → products; slots whose model is gone from the catalog are skipped */
export function resolveBuild(slots: BuildSlugs): Build {
  const build: Build = {};
  for (const slot of buildSlots) {
    const product = slots[slot] ? getProduct(slots[slot]!) : undefined;
    if (product && product.category === slotCategory(slot)) build[slot] = product;
  }
  return build;
}

/** Selected products in slot order */
export function buildProducts(slots: BuildSlugs): Product[] {
  const build = resolveBuild(slots);
  return buildSlots.flatMap((s) => (build[s] ? [build[s]!] : []));
}

/** Categories that must be loaded to show these slots */
export const categoriesOf = (slots: BuildSlugs) => buildSlots.filter((s) => slots[s]).map(slotCategory);

export function useBuild() {
  const slugs = store.useStore();
  const ready = useCatalog(categoriesOf(slugs));
  const build = resolveBuild(slugs);

  // A model that left the catalog (or a mistyped shared link) must not stay in the build forever
  useEffect(() => {
    if (!ready) return;
    const stale = buildSlots.filter((s) => slugs[s] && !build[s]);
    if (stale.length === 0) return;
    store.set((prev) => {
      const next = { ...prev };
      for (const s of stale) delete next[s];
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, slugs]);

  const select = (slot: SlotId, product: Product) => store.set((prev) => ({ ...prev, [slot]: product.slug }));
  const clearSlot = (slot: SlotId) =>
    store.set((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  const reset = () => store.set({});
  /** Replace the whole build (a preset, a saved build, a shared link) */
  const load = (next: BuildSlugs) => store.set({ ...next });

  return { build, slugs, ready, select, clearSlot, reset, load };
}

/** Loads a build without subscribing (menu and home page links) */
export const loadBuild = (next: BuildSlugs) => store.set({ ...next });

export { buildCategories };

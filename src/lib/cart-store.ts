'use client';

import { getProduct } from '@/data';
import type { Product } from '@/data/types';
import { buildSlots, type Build, type BuildSlugs } from './compatibility';
import { createPersistentStore } from './store';

export type { BuildSlugs };

export interface SavedBuild {
  id: string;
  name: string;
  slots: BuildSlugs;
  createdAt: string;
}

const store = createPersistentStore<SavedBuild[]>('component:cart', []);

export function resolveBuild(slots: BuildSlugs): Build {
  const build: Build = {};
  for (const slot of buildSlots) {
    const product = slots[slot] ? getProduct(slots[slot]!) : undefined;
    if (product) build[slot] = product;
  }
  return build;
}

/** Selected products in slot order */
export function buildProducts(slots: BuildSlugs): Product[] {
  const build = resolveBuild(slots);
  return buildSlots.flatMap((s) => (build[s] ? [build[s]!] : []));
}

/** "Ryzen 7 7800X3D + RTX 4070 SUPER" — readable default name from the key parts */
export function suggestName(slots: BuildSlugs, fallbackIndex: number): string {
  const build = resolveBuild(slots);
  const short = (name: string) => name.replace(/^(GeForce|Radeon|Core)\s+/, '');
  const parts = [build.cpu, build.gpu].flatMap((p) => (p ? [short(p.name)] : []));
  return parts.length ? parts.join(' + ') : `Сборка ${fallbackIndex}`;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export function useCart() {
  const builds = store.useStore();

  const add = (slots: BuildSlugs, name?: string): string => {
    const id = uid();
    store.set((prev) => [
      ...prev,
      { id, name: name ?? suggestName(slots, prev.length + 1), slots: { ...slots }, createdAt: new Date().toISOString() },
    ]);
    return id;
  };
  const update = (id: string, patch: Partial<Omit<SavedBuild, 'id'>>) =>
    store.set((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => store.set((prev) => prev.filter((b) => b.id !== id));
  const duplicate = (id: string): string | null => {
    const src = builds.find((b) => b.id === id);
    return src ? add(src.slots, `${src.name} (копия)`) : null;
  };

  return { builds, count: builds.length, add, update, remove, duplicate };
}

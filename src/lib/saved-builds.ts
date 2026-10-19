'use client';

import { type BuildSlugs } from './compatibility';
import { resolveBuild } from './build-store';
import { createPersistentStore } from './store';

export type { BuildSlugs };

/** «Мои сборки»: builds saved in this browser */
export interface SavedBuild {
  id: string;
  name: string;
  slots: BuildSlugs;
  createdAt: string;
}

// The key stays the same as in the old «Корзина», so earlier saved builds are kept
const store = createPersistentStore<SavedBuild[]>('component:cart', []);

/** "Ryzen 7 7800X3D + RTX 4070 SUPER" — readable default name from the key parts */
export function suggestName(slots: BuildSlugs, fallbackIndex: number): string {
  const build = resolveBuild(slots);
  const short = (name: string) => name.replace(/^(GeForce|Radeon|Core)\s+/, '');
  const parts = [build.cpu, build.gpu].flatMap((p) => (p ? [short(p.name)] : []));
  return parts.length ? parts.join(' + ') : `Сборка ${fallbackIndex}`;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export function useSavedBuilds() {
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

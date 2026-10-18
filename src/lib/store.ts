'use client';

import { useSyncExternalStore } from 'react';

/**
 * Tiny persistent store on top of localStorage.
 * Server render and the first client render use `initial`, so markup always hydrates cleanly.
 */
export function createPersistentStore<T>(key: string, initial: T) {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === 'undefined') return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      // Storage can be unavailable (private mode) — keep in-memory state
    }
  };

  const emit = () => listeners.forEach((l) => l());

  const subscribe = (listener: () => void) => {
    load();
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        state = e.newValue ? (JSON.parse(e.newValue) as T) : initial;
      } catch {
        state = initial;
      }
      emit();
    };
    window.addEventListener('storage', onStorage);
    // State may have been loaded after the first snapshot was taken
    queueMicrotask(emit);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  };

  const get = () => state;

  const set = (next: T | ((prev: T) => T)) => {
    load();
    state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota / privacy errors
    }
    emit();
  };

  const useStore = () => useSyncExternalStore(subscribe, get, () => initial);

  return { get, set, useStore };
}

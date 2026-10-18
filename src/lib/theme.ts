'use client';

import { useSyncExternalStore } from 'react';
import { THEME_COLORS, THEME_KEY, type Theme } from './theme-script';

export type { Theme };

const read = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage unavailable — theme still applies for this visit
  }
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * Switch theme with a circular reveal from `origin` (the toggle button) and a light blur.
 * Falls back to a short color cross-fade where View Transitions aren't supported.
 */
export function switchTheme(next: Theme, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Touch devices often have weaker GPUs: switch instantly there instead of animating a full-screen snapshot
  const capable = window.matchMedia('(pointer: fine)').matches;

  if (!doc.startViewTransition || reduce || !capable) {
    setTheme(next);
    return;
  }
  if (origin) {
    root.style.setProperty('--vt-x', `${origin.x}px`);
    root.style.setProperty('--vt-y', `${origin.y}px`);
  }
  root.classList.add('theme-switching');
  doc
    .startViewTransition(() => setTheme(next))
    .finished.finally(() => root.classList.remove('theme-switching'));
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'dark' as Theme);
  const toggle = (origin?: { x: number; y: number }) => switchTheme(theme === 'dark' ? 'light' : 'dark', origin);
  return { theme, toggle };
}

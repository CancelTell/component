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

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'dark' as Theme);
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}

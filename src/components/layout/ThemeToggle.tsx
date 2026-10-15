'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
  return (
    <button type="button" className="btn btn--outline btn--icon theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

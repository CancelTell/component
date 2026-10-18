import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const ROOT = resolve(__dirname, '../..');
export const path = (...p: string[]) => resolve(ROOT, ...p);

export function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path(file), 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/** Stable, diff-friendly JSON (git history stays readable) */
export function writeJson(file: string, data: unknown) {
  const full = path(file);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(data, null, 1)}\n`);
}

export function writeText(file: string, text: string) {
  const full = path(file);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
}

export const exists = (file: string) => existsSync(path(file));
export const today = () => new Date().toISOString().slice(0, 10);

/** --fixtures: run on local test data instead of real feeds and APIs */
export const FIXTURES = process.argv.includes('--fixtures');
/** Generated files go to data/ (committed, read by the site); test runs write to .cache/test */
export const OUT = FIXTURES ? '.cache/test' : 'data';

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/(\d)\s+(гб|тб|gb|tb)(?![a-zа-я])/g, '$1$2') // "1 ТБ" → "1tb", like the hand-made slugs
    .replace(/[а-яё]/g, (c) => TRANSLIT[c] ?? '')
    .replace(/×/g, 'x')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Words for loose name matching: "FURY Beast DDR5-6000 2×16 ГБ" → fury beast ddr5 6000 2x16 gb */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/×/g, 'x')
    .replace(/гб/g, 'gb')
    .replace(/тб/g, 'tb')
    .replace(/мгц/g, 'mhz')
    .replace(/(\d)\s*x\s*(\d)/g, '$1x$2')
    .replace(/\b(oem|box|mpk|tray|bulk|retail)\b/g, ' ')
    .split(/[^a-zа-яё0-9_]+/i)
    .filter((w) => w.length > 0);
}

export const normEan = (s: string | undefined) => {
  const d = (s ?? '').replace(/\D/g, '');
  return d.length >= 8 ? d.padStart(13, '0') : '';
};
export const normMpn = (s: string | undefined) => (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function log(...args: unknown[]) {
  console.log('[data]', ...args);
}

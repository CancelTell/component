import type { Product, SpecDef, SpecValue } from '@/data/types';

const NBSP = ' ';

export function formatNumber(value: number, decimals?: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 2,
    useGrouping: value >= 10000,
  });
}

export function rawSpec(product: Product, def: SpecDef): SpecValue {
  return def.get ? def.get(product) : (product.specs[def.key] ?? null);
}

export function formatSpec(product: Product, def: SpecDef): string {
  const value = rawSpec(product, def);
  if (def.format) return def.format(value);
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (Array.isArray(value)) return value.join(' / ');
  if (typeof value === 'number') {
    const num = formatNumber(value, def.decimals);
    return def.unit ? `${num}${NBSP}${def.unit}` : num;
  }
  return def.unit ? `${value}${NBSP}${def.unit}` : value;
}

/** Numeric rank of a spec used to choose the best value in comparison */
export function rankSpec(product: Product, def: SpecDef): number | null {
  if (def.rank) return def.rank(product);
  const value = rawSpec(product, def);
  return typeof value === 'number' ? value : null;
}

export function pluralize(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export const modelsLabel = (count: number) =>
  `${count} ${pluralize(count, ['модель', 'модели', 'моделей'])}`;

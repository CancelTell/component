import { bestOffer } from '@/data/offers';
import { categoryById, getProductsByCategory } from '@/data';
import type { CategoryConfig, Product, SpecDef } from '@/data/types';
import { formatSpec } from './format';

/** Find a spec definition by key across all groups of a category */
export function findSpec(config: CategoryConfig, key: string): SpecDef | undefined {
  for (const group of config.groups) {
    const def = group.specs.find((s) => s.key === key);
    if (def) return def;
  }
  return undefined;
}

export function allSpecs(config: CategoryConfig): SpecDef[] {
  return config.groups.flatMap((g) => g.specs);
}

export interface StatItem {
  label: string;
  value: string;
  mono: boolean;
}

export function getStats(product: Product, keys: string[]): StatItem[] {
  const config = categoryById[product.category];
  return keys.flatMap((key) => {
    const def = findSpec(config, key);
    return def ? [{ label: def.short ?? def.label, value: formatSpec(product, def), mono: !!def.mono }] : [];
  });
}

export function productHref(product: Product): string {
  return `/catalog/${product.category}/${product.slug}`;
}

export function productMeta(product: Product): string {
  return categoryById[product.category].meta(product).filter(Boolean).join(' · ');
}

/** Short one-line summary in mono: "8 / 16 · 5,0 ГГц · 120 Вт" */
export function productSummary(product: Product): string {
  const config = categoryById[product.category];
  return getStats(product, config.summarySpecs ?? config.cardSpecs)
    .map((s) => s.value)
    .join(' · ');
}

/** Models of the same category that are closest: same platform (socket / type) first, then by popularity */
export function getSimilar(product: Product, limit = 2): Product[] {
  const config = categoryById[product.category];
  const platform = config.meta(product)[1];
  const score = (p: Product) =>
    (config.meta(p)[1] === platform ? 0 : 100) + (p.brand === product.brand ? 0 : 10) + Math.abs(p.popularity - product.popularity);
  return getProductsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit);
}

export type SortId = 'popular' | 'cheap' | 'expensive' | 'new' | 'name';

export const sortOptions: Array<{ id: SortId; label: string }> = [
  { id: 'popular', label: 'По популярности' },
  { id: 'cheap', label: 'Сначала дешевле' },
  { id: 'expensive', label: 'Сначала дороже' },
  { id: 'new', label: 'Сначала новые' },
  { id: 'name', label: 'По названию' },
];

export function sortProducts(list: Product[], sort: SortId): Product[] {
  const copy = [...list];
  switch (sort) {
    case 'cheap':
    case 'expensive': {
      // Models without an in-stock offer always go last
      const dir = sort === 'cheap' ? 1 : -1;
      const pr = (p: Product) => bestOffer(p.slug)?.price ?? null;
      return copy.sort((a, b) => {
        const x = pr(a);
        const y = pr(b);
        if (x === null || y === null) return x === y ? a.popularity - b.popularity : x === null ? 1 : -1;
        return (x - y) * dir;
      });
    }
    case 'new':
      return copy.sort((a, b) => b.year - a.year || a.popularity - b.popularity);
    case 'name':
      return copy.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, 'ru'));
    default:
      return copy.sort((a, b) => a.popularity - b.popularity);
  }
}

/** Active filters: groupId → selected option ids */
export type FilterState = Record<string, string[]>;

export function applyFilters(list: Product[], config: CategoryConfig, state: FilterState): Product[] {
  const active = config.filters.filter((g) => (state[g.id]?.length ?? 0) > 0);
  if (active.length === 0) return list;
  return list.filter((p) =>
    active.every((group) =>
      group.options.some((o) => state[group.id]!.includes(o.id) && o.test(p)),
    ),
  );
}

export function countActiveFilters(state: FilterState): number {
  return Object.values(state).reduce((acc, ids) => acc + ids.length, 0);
}

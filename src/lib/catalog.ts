/**
 * Catalog helpers shared by the server and the browser: spec formatting, facets, sorting.
 * Nothing here imports the catalog data itself.
 */
import { categoryById } from '@/data/categories';
import type { CategoryConfig, FacetDef, Product, SpecDef, SpecValue } from '@/data/types';
import { formatSpec, rankSpec } from './format';

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

export function productHref(product: Pick<Product, 'category' | 'slug'>): string {
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
    .filter((v) => v !== '—')
    .join(' · ');
}

/* ---------- Facets ---------- */

/** Values of an enum facet for one product (a cooler fits several sockets) */
export function facetValues(product: Product, def: FacetDef): string[] {
  const v: SpecValue | undefined = def.get ? def.get(product) : product.specs[def.key];
  if (v === null || v === undefined || v === '') return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'boolean') return [v ? 'Да' : 'Нет'];
  return [String(v)];
}

/** Number of a range facet; null when unknown */
export function facetNumber(product: Product, def: FacetDef): number | null {
  const v = def.get ? def.get(product) : product.specs[def.key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

const collator = new Intl.Collator('ru', { numeric: true });

/** Values present in the list with counts: most common first */
export function facetOptions(list: Product[], def: FacetDef): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const p of list) for (const v of facetValues(p, def)) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || collator.compare(a.value, b.value));
}

export function facetBounds(list: Product[], def: FacetDef): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const p of list) {
    const v = facetNumber(p, def);
    if (v === null) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return min <= max ? { min, max } : null;
}

export interface Range {
  min?: number;
  max?: number;
}

/** Filters of the category page; also lives in the URL */
export interface FilterState {
  /** facet key → selected values */
  enums: Record<string, string[]>;
  /** facet key → interval */
  ranges: Record<string, Range>;
  price: Range;
  inStock: boolean;
}

export const emptyFilters = (): FilterState => ({ enums: {}, ranges: {}, price: {}, inStock: false });

const inRange = (v: number | null, r: Range | undefined) =>
  !r || (r.min === undefined && r.max === undefined) || (v !== null && (r.min === undefined || v >= r.min) && (r.max === undefined || v <= r.max));

export function applyFilters(
  list: Product[],
  config: CategoryConfig,
  state: FilterState,
  priceOf: (p: Product) => number | null,
  /** Skip one facet: option counts of a facet are computed without its own selection */
  except?: string,
): Product[] {
  return list.filter((p) => {
    for (const def of config.facets) {
      if (def.key === except) continue;
      if (def.type === 'enum') {
        const sel = state.enums[def.key];
        if (sel?.length && !facetValues(p, def).some((v) => sel.includes(v))) return false;
      } else if (!inRange(facetNumber(p, def), state.ranges[def.key])) return false;
    }
    if (except !== 'price' && !inRange(priceOf(p), state.price)) return false;
    if (state.inStock && priceOf(p) === null) return false;
    return true;
  });
}

export function countActiveFilters(state: FilterState): number {
  const ranges = Object.values(state.ranges).filter((r) => r.min !== undefined || r.max !== undefined).length;
  const price = state.price.min !== undefined || state.price.max !== undefined ? 1 : 0;
  return Object.values(state.enums).reduce((a, v) => a + v.length, 0) + ranges + price + (state.inStock ? 1 : 0);
}

/* ---------- Sorting ---------- */

/** 'popular' | 'name' | 'price' | 'year' | any spec key; direction separately */
export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export const defaultSort: SortState = { key: 'popular', dir: 'asc' };

export const sortOptions: Array<{ id: string; label: string; sort: SortState; needsPrices?: boolean }> = [
  { id: 'popular', label: 'По популярности', sort: { key: 'popular', dir: 'asc' } },
  { id: 'price-asc', label: 'Сначала дешевле', sort: { key: 'price', dir: 'asc' }, needsPrices: true },
  { id: 'price-desc', label: 'Сначала дороже', sort: { key: 'price', dir: 'desc' }, needsPrices: true },
  { id: 'year-desc', label: 'Сначала новые', sort: { key: 'year', dir: 'desc' } },
  { id: 'name-asc', label: 'По названию', sort: { key: 'name', dir: 'asc' } },
];

export function sortProducts(list: Product[], sort: SortState, priceOf: (p: Product) => number | null): Product[] {
  const config = list[0] ? categoryById[list[0].category] : null;
  const def = config && !['popular', 'name', 'price', 'year'].includes(sort.key) ? findSpec(config, sort.key) : undefined;
  const dir = sort.dir === 'asc' ? 1 : -1;

  const numberOf = (p: Product): number | null => {
    if (sort.key === 'price') return priceOf(p);
    if (sort.key === 'year') return p.year || null;
    if (def) {
      const r = rankSpec(p, def);
      return r === null || Number.isNaN(r) ? null : r;
    }
    return null;
  };

  const copy = [...list];
  if (sort.key === 'popular') return copy.sort((a, b) => a.popularity - b.popularity);
  if (sort.key === 'name') return copy.sort((a, b) => collator.compare(`${a.brand} ${a.name}`, `${b.brand} ${b.name}`) * dir);

  // Numeric column; text columns (socket, chipset…) fall back to text order. Unknown values always last.
  return copy.sort((a, b) => {
    const x = numberOf(a);
    const y = numberOf(b);
    if (x !== null || y !== null) {
      if (x === null) return 1;
      if (y === null) return -1;
      return (x - y) * dir || a.popularity - b.popularity;
    }
    if (def) {
      const sa = formatSpec(a, def);
      const sb = formatSpec(b, def);
      if (sa === '—' || sb === '—') return sa === sb ? 0 : sa === '—' ? 1 : -1;
      return collator.compare(sa, sb) * dir || a.popularity - b.popularity;
    }
    return a.popularity - b.popularity;
  });
}

/* ---------- URL ---------- */

/**
 * ?brand=AMD,Intel&cores=8-16&price=-50000&stock=1&sort=boostClock.desc
 * Values with commas are rare; they are escaped as %2C by URLSearchParams.
 */
export function filtersToQuery(config: CategoryConfig, f: FilterState, sort: SortState): string {
  const q = new URLSearchParams();
  const range = (r: Range) => `${r.min ?? ''}-${r.max ?? ''}`;
  for (const def of config.facets) {
    if (def.type === 'enum' && f.enums[def.key]?.length) q.set(def.key, f.enums[def.key]!.map(encodeValue).join(','));
    const r = f.ranges[def.key];
    if (def.type === 'range' && r && (r.min !== undefined || r.max !== undefined)) q.set(def.key, range(r));
  }
  if (f.price.min !== undefined || f.price.max !== undefined) q.set('price', range(f.price));
  if (f.inStock) q.set('stock', '1');
  if (sort.key !== defaultSort.key || sort.dir !== defaultSort.dir) q.set('sort', `${sort.key}.${sort.dir}`);
  return q.toString();
}

const encodeValue = (v: string) => v.replace(/,/g, '﹐');
const decodeValue = (v: string) => v.replace(/﹐/g, ',');

function parseRange(value: string | null): Range {
  if (!value) return {};
  const [a, b] = value.split('-');
  const num = (x: string | undefined) => (x && Number.isFinite(Number(x)) ? Number(x) : undefined);
  return { min: num(a), max: num(b) };
}

export function queryToFilters(config: CategoryConfig, query: string): { filters: FilterState; sort: SortState } {
  const q = new URLSearchParams(query);
  const filters = emptyFilters();
  for (const def of config.facets) {
    const v = q.get(def.key);
    if (!v) continue;
    if (def.type === 'enum') filters.enums[def.key] = v.split(',').filter(Boolean).map(decodeValue);
    else filters.ranges[def.key] = parseRange(v);
  }
  filters.price = parseRange(q.get('price'));
  filters.inStock = q.get('stock') === '1';
  const [key, dir] = (q.get('sort') ?? '').split('.');
  const sort: SortState = key && (dir === 'asc' || dir === 'desc') ? { key, dir } : defaultSort;
  return { filters, sort };
}

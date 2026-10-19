'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { categoryById } from '@/data/categories';
import type { CategoryId, CategoryPayload, FacetDef, Product } from '@/data/types';
import {
  applyFilters,
  countActiveFilters,
  facetValues,
  defaultSort,
  emptyFilters,
  filtersToQuery,
  findSpec,
  productHref,
  queryToFilters,
  sortOptions,
  sortProducts,
  type FilterState,
  type SortState,
} from '@/lib/catalog';
import { bestOffer, primeCategory } from '@/lib/catalog-client';
import { formatSpec, modelsLabel } from '@/lib/format';
import { HAS_PRICES, rub } from '@/lib/pricing';
import { createPersistentStore } from '@/lib/store';
import { Sheet } from '@/components/ui/Sheet';
import { FacetPanel } from './FacetPanel';
import { ProductCard } from './ProductCard';
import { CompareButton } from './CompareButton';

interface Props {
  category: CategoryId;
  payload: CategoryPayload;
}

const PAGE = 30;
type View = 'table' | 'cards';
const viewStore = createPersistentStore<View>('component:catalog-view-v2', 'cards');

const priceOf = (p: Product) => bestOffer(p.slug)?.price ?? null;

/** Reads filters from the URL inside its own Suspense boundary, so the list itself stays static */
function UrlFilters({ onChange }: { onChange: (query: string) => void }) {
  const query = useSearchParams().toString();
  useEffect(() => onChange(query), [query, onChange]);
  return null;
}

export function CatalogView({ category, payload }: Props) {
  primeCategory(category, payload);
  const config = categoryById[category];
  const products = payload.products;
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [shown, setShown] = useState(PAGE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const view = viewStore.useStore();

  const visible = useMemo(
    () => sortProducts(applyFilters(products, config, filters, priceOf), sort, priceOf),
    [products, config, filters, sort],
  );
  const activeCount = countActiveFilters(filters);

  /* URL ⇄ state. lastQuery ignores the echo of our own replaceState. */
  const lastQuery = useRef<string | null>(null);
  const applyQuery = useCallback(
    (query: string) => {
      if (query === lastQuery.current) return;
      lastQuery.current = query;
      const parsed = queryToFilters(config, query);
      setFilters(parsed.filters);
      setSort(parsed.sort);
    },
    [config],
  );
  const urlReady = useRef(false);
  useEffect(() => {
    if (!urlReady.current) {
      urlReady.current = true;
      return;
    }
    const qs = filtersToQuery(config, filters, sort);
    if (qs === lastQuery.current) return;
    lastQuery.current = qs;
    window.history.replaceState(window.history.state, '', qs ? `?${qs}` : window.location.pathname);
  }, [config, filters, sort]);

  // New filter → back to the first page
  useEffect(() => setShown(PAGE), [filters, sort]);

  const toggleValue = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const cur = prev.enums[key] ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, enums: { ...prev.enums, [key]: next } };
    });
  }, []);
  const reset = () => setFilters(emptyFilters());
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const sortBy = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }));

  const columns = config.tableSpecs.flatMap((k) => {
    const def = findSpec(config, k);
    return def ? [def] : [];
  });
  const page = visible.slice(0, shown);
  const countText = modelsLabel(visible.length);
  const chips = activeChips(filters, config.facets);

  const panel = (
    <FacetPanel
      config={config}
      products={products}
      filters={filters}
      priceOf={priceOf}
      onToggle={toggleValue}
      onChange={setFilters}
    />
  );

  return (
    <>
      <Suspense fallback={null}>
        <UrlFilters onChange={applyQuery} />
      </Suspense>

      <div className="cat">
        <aside className="cat__side" aria-label="Фильтры">
          {panel}
        </aside>

        <div className="cat__main">
          <div className="chips chips--scroll cat__quick" role="group" aria-label="Быстрые фильтры">
            {config.quick.map(([key, value]) => {
              const active = filters.enums[key]?.includes(value) ?? false;
              const def = config.facets.find((f) => f.key === key);
              if (!def || (!active && !products.some((p) => facetValues(p, def).includes(value)))) return null;
              return (
                <button key={`${key}:${value}`} type="button" className={`chip${active ? ' chip--active' : ''}`} aria-pressed={active} onClick={() => toggleValue(key, value)}>
                  {value}
                </button>
              );
            })}
          </div>

          <div className="cat__toolbar">
            <p className="cat__count" aria-live="polite">
              {countText}
            </p>
            <button type="button" className="btn btn--outline btn--sm cat__filters-btn" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal size={16} aria-hidden="true" />
              Фильтры
              {activeCount > 0 && <span className="btn__badge">{activeCount}</span>}
            </button>
            <label className="cat__sort">
              <span className="visually-hidden">Сортировка</span>
              <select
                className="select"
                value={sortOptions.find((o) => o.sort.key === sort.key && o.sort.dir === sort.dir)?.id ?? 'custom'}
                onChange={(e) => {
                  const o = sortOptions.find((x) => x.id === e.target.value);
                  if (o) setSort(o.sort);
                }}
              >
                {sortOptions
                  .filter((o) => !o.needsPrices || HAS_PRICES)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                {!sortOptions.some((o) => o.sort.key === sort.key && o.sort.dir === sort.dir) && (
                  <option value="custom">По колонке: {findSpec(config, sort.key)?.label ?? sort.key}</option>
                )}
              </select>
            </label>
            <div className="seg" role="group" aria-label="Вид списка">
              <button type="button" className="seg__btn" aria-pressed={view === 'table'} onClick={() => viewStore.set('table')} title="Таблица">
                <List size={16} aria-hidden="true" />
                <span className="visually-hidden">Таблица</span>
              </button>
              <button type="button" className="seg__btn" aria-pressed={view === 'cards'} onClick={() => viewStore.set('cards')} title="Карточки">
                <LayoutGrid size={16} aria-hidden="true" />
                <span className="visually-hidden">Карточки</span>
              </button>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="cat__active" role="list" aria-label="Выбранные фильтры">
              {chips.map((c) => (
                <li key={c.id}>
                  <button type="button" className="chip chip--active chip--x" onClick={() => setFilters((f) => c.remove(f))}>
                    {c.label}
                    <X size={14} aria-hidden="true" />
                    <span className="visually-hidden">— убрать</span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className="link-btn" onClick={reset}>
                  Сбросить все
                </button>
              </li>
            </ul>
          )}

          {!HAS_PRICES && (
            <p className="note">Цены появятся после подключения магазинов. Пока каталог — это характеристики и проверка совместимости.</p>
          )}

          {visible.length === 0 ? (
            <div className="card results-empty">
              <p className="title-3">Под фильтры ничего не подошло</p>
              <p className="text-muted">Уберите часть условий.</p>
              <button type="button" className="btn btn--outline" onClick={reset}>
                Сбросить фильтры
              </button>
            </div>
          ) : view === 'table' ? (
            <div className="ctable-wrap">
              <table className="ctable">
                <thead>
                  <tr>
                    <SortTh label="Модель" k="name" sort={sort} onSort={sortBy} className="ctable__name" />
                    {columns.map((def) => (
                      <SortTh key={def.key} label={def.short ?? def.label} k={def.key} sort={sort} onSort={sortBy} numeric={!!def.mono} />
                    ))}
                    {HAS_PRICES && <SortTh label="Цена" k="price" sort={sort} onSort={sortBy} numeric />}
                    <th scope="col" className="ctable__act">
                      <span className="visually-hidden">Сравнение</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.map((p) => {
                    const offer = HAS_PRICES ? bestOffer(p.slug) : null;
                    return (
                      <tr key={p.slug}>
                        <th scope="row" className="ctable__name">
                          <Link href={productHref(p)} className="ctable__link">
                            <span className="ctable__brand">{p.brand}</span> {p.name}
                          </Link>
                        </th>
                        {columns.map((def) => (
                          <td key={def.key} className={def.mono ? 'num' : undefined}>
                            {formatSpec(p, def)}
                          </td>
                        ))}
                        {HAS_PRICES && <td className="num ctable__price">{offer ? rub(offer.price!) : <span className="text-muted">нет</span>}</td>}
                        <td className="ctable__act">
                          <CompareButton product={p} compact />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="results">
              {page.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i % 30} />
              ))}
            </div>
          )}

          {visible.length > shown && (
            <div className="cat__more">
              <button type="button" className="btn btn--outline" onClick={() => setShown((n) => n + PAGE)}>
                Показать ещё {Math.min(PAGE, visible.length - shown)}
              </button>
              <span className="text-muted">
                Показано {shown} из {visible.length}
              </span>
            </div>
          )}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        title="Фильтры"
        onClose={closeSheet}
        footer={
          <>
            <button type="button" className="btn btn--outline btn--lg" onClick={reset}>
              Сбросить
            </button>
            <button type="button" className="btn btn--accent btn--lg btn--grow" onClick={closeSheet}>
              Показать {countText}
            </button>
          </>
        }
      >
        {panel}
      </Sheet>
    </>
  );
}

function SortTh({
  label,
  k,
  sort,
  onSort,
  numeric = false,
  className = '',
}: {
  label: string;
  k: string;
  sort: SortState;
  onSort: (k: string) => void;
  numeric?: boolean;
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <th scope="col" className={`${className}${numeric ? ' num' : ''}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="ctable__sort" onClick={() => onSort(k)}>
        {label}
        {active && (sort.dir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
      </button>
    </th>
  );
}

/** Removable chips for everything that is filtered right now */
function activeChips(f: FilterState, facets: FacetDef[]) {
  const out: Array<{ id: string; label: string; remove: (f: FilterState) => FilterState }> = [];
  const span = (min?: number, max?: number, unit = '') =>
    `${min !== undefined ? `от ${min}` : ''}${min !== undefined && max !== undefined ? ' ' : ''}${max !== undefined ? `до ${max}` : ''}${unit ? ` ${unit}` : ''}`;
  for (const def of facets) {
    for (const v of f.enums[def.key] ?? []) {
      out.push({
        id: `${def.key}:${v}`,
        label: def.key === 'brand' ? v : `${def.label}: ${v}`,
        remove: (s) => ({ ...s, enums: { ...s.enums, [def.key]: (s.enums[def.key] ?? []).filter((x) => x !== v) } }),
      });
    }
    const r = f.ranges[def.key];
    if (r && (r.min !== undefined || r.max !== undefined)) {
      out.push({
        id: `${def.key}:range`,
        label: `${def.label} ${span(r.min, r.max, def.unit)}`,
        remove: (s) => {
          const ranges = { ...s.ranges };
          delete ranges[def.key];
          return { ...s, ranges };
        },
      });
    }
  }
  if (f.price.min !== undefined || f.price.max !== undefined) out.push({ id: 'price', label: `Цена ${span(f.price.min, f.price.max, '₽')}`, remove: (s) => ({ ...s, price: {} }) });
  if (f.inStock) out.push({ id: 'stock', label: 'В наличии', remove: (s) => ({ ...s, inStock: false }) });
  return out;
}

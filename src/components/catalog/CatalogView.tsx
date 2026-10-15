'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowDownUp, Filter } from 'lucide-react';
import { categoryById } from '@/data';
import type { CategoryId, Product } from '@/data/types';
import {
  applyFilters,
  countActiveFilters,
  sortOptions,
  sortProducts,
  type FilterState,
  type SortId,
} from '@/lib/catalog';
import { modelsLabel } from '@/lib/format';
import { Sheet } from '@/components/ui/Sheet';
import { FilterControls } from './FilterControls';
import { ProductCard } from './ProductCard';

interface Props {
  category: CategoryId;
  products: Product[];
}

function parseQuery(query: string, groupIds: string[]): { filters: FilterState; sort: SortId } {
  const params = new URLSearchParams(query);
  const filters: FilterState = {};
  for (const id of groupIds) {
    const value = params.get(id);
    if (value) filters[id] = value.split(',').filter(Boolean);
  }
  const sort = sortOptions.some((o) => o.id === params.get('sort')) ? (params.get('sort') as SortId) : 'popular';
  return { filters, sort };
}

/**
 * Reads filters from the URL (shared links, quick links from the header menu).
 * Isolated in its own Suspense boundary so the product list itself stays statically rendered.
 */
function UrlFilters({ onChange }: { onChange: (query: string) => void }) {
  const query = useSearchParams().toString();
  useEffect(() => onChange(query), [query, onChange]);
  return null;
}

/** Keep filters in the URL so a filtered list can be shared or bookmarked */
function toQuery(filters: FilterState, sort: SortId): string {
  const params = new URLSearchParams();
  for (const [group, ids] of Object.entries(filters)) if (ids.length) params.set(group, ids.join(','));
  if (sort !== 'popular') params.set('sort', sort);
  return params.toString();
}

export function CatalogView({ category, products }: Props) {
  const config = categoryById[category];
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<SortId>('popular');
  const urlReady = useRef(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = useMemo(
    () => sortProducts(applyFilters(products, config, filters), sort),
    [products, config, filters, sort],
  );
  const activeCount = countActiveFilters(filters);

  const lastQuery = useRef<string | null>(null);
  const applyQuery = useCallback(
    (query: string) => {
      // Ignore the echo of our own replaceState below
      if (query === lastQuery.current) return;
      lastQuery.current = query;
      const parsed = parseQuery(query, config.filters.map((g) => g.id));
      setFilters(parsed.filters);
      setSort(parsed.sort);
    },
    [config],
  );

  useEffect(() => {
    if (!urlReady.current) {
      urlReady.current = true;
      return;
    }
    const qs = toQuery(filters, sort);
    if (qs === lastQuery.current) return;
    lastQuery.current = qs;
    window.history.replaceState(window.history.state, '', qs ? `?${qs}` : window.location.pathname);
  }, [filters, sort]);

  const toggle = useCallback((groupId: string, optionId: string) => {
    setFilters((prev) => {
      const current = prev[groupId] ?? [];
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [groupId]: next };
    });
  }, []);

  const reset = () => setFilters({});
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const countText = modelsLabel(visible.length);

  return (
    <>
      <Suspense fallback={null}>
        <UrlFilters onChange={applyQuery} />
      </Suspense>
      <p className="catalog__count catalog__count--head" aria-live="polite">
        {countText}
      </p>

      <div className="catalog">
        <aside className="catalog__aside" aria-label="Фильтры">
          <div className="card filters">
            <div className="filters__head">
              <h2 className="filters__title">Фильтры</h2>
              <button type="button" className="filters__reset" onClick={reset} disabled={activeCount === 0}>
                Сбросить
              </button>
            </div>
            <FilterControls groups={config.filters} state={filters} onToggle={toggle} variant="checkbox" />
          </div>
        </aside>

        <div className="catalog__main">
          <div className="chips chips--scroll" role="group" aria-label="Быстрые фильтры">
            <button
              type="button"
              className={`chip${activeCount === 0 ? ' chip--active' : ''}`}
              aria-pressed={activeCount === 0}
              onClick={reset}
            >
              Все
            </button>
            {config.quickFilters.map(([groupId, optionId]) => {
              const option = config.filters.find((g) => g.id === groupId)?.options.find((o) => o.id === optionId);
              if (!option) return null;
              const active = filters[groupId]?.includes(optionId) ?? false;
              return (
                <button
                  key={`${groupId}:${optionId}`}
                  type="button"
                  className={`chip${active ? ' chip--active' : ''}`}
                  aria-pressed={active}
                  onClick={() => toggle(groupId, optionId)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="catalog__toolbar">
            <p className="catalog__count catalog__count--toolbar" aria-live="polite">
              {countText}
            </p>
            <button type="button" className="btn btn--outline catalog__filters-btn" onClick={() => setSheetOpen(true)}>
              <Filter size={18} aria-hidden="true" />
              Фильтры
              {activeCount > 0 && <span className="btn__badge">{activeCount}</span>}
            </button>
            <div className="sort">
              <select
                className="sort__select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                aria-label="Сортировка"
              >
                {sortOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="btn btn--outline" aria-hidden="true">
                <ArrowDownUp size={18} />
                {sortOptions.find((o) => o.id === sort)?.label}
              </span>
            </div>
          </div>

          {visible.length > 0 ? (
            <div className="results">
              {visible.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="card results-empty">
              <p className="title-3">Под фильтры ничего не подошло</p>
              <p className="text-muted">Попробуйте убрать часть условий.</p>
              <button type="button" className="btn btn--outline" onClick={reset}>
                Сбросить фильтры
              </button>
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
        <FilterControls groups={config.filters} state={filters} onToggle={toggle} variant="chips" />
      </Sheet>
    </>
  );
}

'use client';

import { Fragment, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { QuickView } from './QuickView';

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

  // ---------- Quick view: opens inline under the row of the clicked card ----------
  const gridRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  // Card the user acted on, kept in place on screen when the layout above it changes
  const anchor = useRef<{ slug: string; top: number } | null>(null);

  // Track how many columns the grid currently has
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      setColumns(Math.max(1, cols));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [visible.length]);

  const selectedIndex = selectedSlug ? visible.findIndex((p) => p.slug === selectedSlug) : -1;
  const selected = selectedIndex >= 0 ? visible[selectedIndex]! : null;
  const rowEnd = selectedIndex >= 0 ? Math.min(visible.length - 1, Math.ceil((selectedIndex + 1) / columns) * columns - 1) : -1;

  const rememberAnchor = (slug: string) => {
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-slug="${slug}"]`);
    anchor.current = el ? { slug, top: el.getBoundingClientRect().top } : null;
  };

  const select = useCallback((slug: string | null) => {
    if (slug) rememberAnchor(slug);
    setSelectedSlug(slug);
  }, []);

  const openDetail = useCallback(
    (p: Product) => select(selectedSlug === p.slug ? null : p.slug),
    [select, selectedSlug],
  );
  const closeDetail = useCallback(() => {
    const current = selectedSlug;
    if (current) rememberAnchor(current);
    setSelectedSlug(null);
  }, [selectedSlug]);
  const step = useCallback(
    (dir: 1 | -1) => {
      if (selectedIndex < 0 || visible.length === 0) return;
      const next = visible[(selectedIndex + dir + visible.length) % visible.length]!;
      select(next.slug);
    },
    [selectedIndex, visible, select],
  );

  // Keep the clicked card where it was (the panel may have moved from a row above),
  // then make sure the panel is fully visible with the smallest possible scroll.
  useLayoutEffect(() => {
    const a = anchor.current;
    anchor.current = null;
    if (a) {
      const el = gridRef.current?.querySelector<HTMLElement>(`[data-slug="${a.slug}"]`);
      if (el) {
        const delta = el.getBoundingClientRect().top - a.top;
        if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
      }
    }
    if (!selectedSlug) return;
    const id = window.setTimeout(() => {
      const panel = quickRef.current;
      const card = gridRef.current?.querySelector<HTMLElement>(`[data-slug="${selectedSlug}"]`);
      if (!panel || !card) return;
      const header = 88;
      const top = card.getBoundingClientRect().top;
      const bottom = panel.getBoundingClientRect().bottom;
      const vh = window.innerHeight;
      if (bottom > vh - 16) {
        // scroll down just enough, but never push the card under the header
        window.scrollBy({ top: Math.min(bottom - vh + 16, top - header), behavior: 'smooth' });
      } else if (top < header) {
        window.scrollBy({ top: top - header, behavior: 'smooth' });
      }
    }, 380);
    return () => window.clearTimeout(id);
  }, [selectedSlug, columns]);

  // Keyboard: ← → switch models, Esc closes
  useEffect(() => {
    if (!selectedSlug) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, select, textarea, [role="dialog"]')) return;
      if (e.key === 'Escape') closeDetail();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedSlug, closeDetail, step]);

  return (
    <>
      <Suspense fallback={null}>
        <UrlFilters onChange={applyQuery} />
      </Suspense>
      <p className="catalog__count catalog__count--head" aria-live="polite">
        {countText}
      </p>

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
          <div className="results" ref={gridRef}>
            {visible.map((p, i) => (
              <Fragment key={p.slug}>
                <ProductCard product={p} index={i} selected={p.slug === selectedSlug} onOpen={openDetail} />
                {i === rowEnd && selected && (
                  <QuickView
                    key={`row-${Math.floor(selectedIndex / columns)}`}
                    ref={quickRef}
                    product={selected}
                    column={selectedIndex % columns}
                    columns={columns}
                    position={selectedIndex + 1}
                    total={visible.length}
                    onClose={closeDetail}
                    onPrev={() => step(-1)}
                    onNext={() => step(1)}
                  />
                )}
              </Fragment>
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

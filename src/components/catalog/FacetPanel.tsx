'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CategoryConfig, FacetDef, Product } from '@/data/types';
import { applyFilters, facetBounds, facetOptions, type FilterState, type Range } from '@/lib/catalog';
import { HAS_PRICES } from '@/lib/pricing';

interface Props {
  config: CategoryConfig;
  products: Product[];
  filters: FilterState;
  priceOf: (p: Product) => number | null;
  onToggle: (key: string, value: string) => void;
  onChange: (next: FilterState | ((prev: FilterState) => FilterState)) => void;
}

const FOLDED = 6;

/**
 * Filters built from the data itself: every value that occurs in the category, with the number
 * of models it would leave (counted with all the other filters applied).
 */
export function FacetPanel({ config, products, filters, priceOf, onToggle, onChange }: Props) {
  const setRange = (key: string, r: Range) =>
    onChange((f) => ({ ...f, ranges: { ...f.ranges, [key]: r } }));

  return (
    <div className="facets">
      {HAS_PRICES && (
        <fieldset className="facet">
          <legend className="facet__label">Цена, ₽</legend>
          <RangeInputs value={filters.price} bounds={null} onChange={(r) => onChange((f) => ({ ...f, price: r }))} />
          <label className="checkbox">
            <input type="checkbox" className="checkbox__input" checked={filters.inStock} onChange={(e) => onChange((f) => ({ ...f, inStock: e.target.checked }))} />
            Есть в наличии
          </label>
        </fieldset>
      )}
      {config.facets.map((def) =>
        def.type === 'enum' ? (
          <EnumFacet key={def.key} def={def} config={config} products={products} filters={filters} priceOf={priceOf} onToggle={onToggle} />
        ) : (
          <RangeFacet key={def.key} def={def} products={products} value={filters.ranges[def.key] ?? {}} onChange={(r) => setRange(def.key, r)} />
        ),
      )}
    </div>
  );
}

function EnumFacet({ def, config, products, filters, priceOf, onToggle }: { def: FacetDef } & Omit<Props, 'onChange'>) {
  const [open, setOpen] = useState(false);
  const selected = filters.enums[def.key] ?? [];
  // Counts reflect the other filters, so a value never leads to an empty list
  const base = useMemo(() => applyFilters(products, config, filters, priceOf, def.key), [products, config, filters, priceOf, def.key]);
  const options = useMemo(() => {
    const counts = new Map(facetOptions(base, def).map((o) => [o.value, o.count]));
    return facetOptions(products, def).map((o) => ({ value: o.value, count: counts.get(o.value) ?? 0 }));
  }, [base, products, def]);
  if (options.length < 2 && selected.length === 0) return null;

  const list = open ? [...options] : options.slice(0, FOLDED);
  // Selected values always stay visible
  for (const v of selected) if (!list.some((o) => o.value === v)) list.push(options.find((o) => o.value === v) ?? { value: v, count: 0 });

  return (
    <fieldset className="facet">
      <legend className="facet__label">{def.label}</legend>
      <div className="facet__options">
        {list.map((o) => (
          <label key={o.value} className={`checkbox${o.count === 0 && !selected.includes(o.value) ? ' is-empty' : ''}`}>
            <input type="checkbox" className="checkbox__input" checked={selected.includes(o.value)} onChange={() => onToggle(def.key, o.value)} />
            <span className="checkbox__text">{o.value}</span>
            <span className="facet__count">{o.count}</span>
          </label>
        ))}
      </div>
      {options.length > FOLDED && (
        <button type="button" className="link-btn facet__more" onClick={() => setOpen((v) => !v)}>
          {open ? 'Свернуть' : `Ещё ${options.length - FOLDED}`}
        </button>
      )}
    </fieldset>
  );
}

function RangeFacet({ def, products, value, onChange }: { def: FacetDef; products: Product[]; value: Range; onChange: (r: Range) => void }) {
  const bounds = useMemo(() => facetBounds(products, def), [products, def]);
  if (!bounds || bounds.min === bounds.max) return null;
  return (
    <fieldset className="facet">
      <legend className="facet__label">
        {def.label}
        {def.unit ? `, ${def.unit}` : ''}
      </legend>
      <RangeInputs value={value} bounds={bounds} onChange={onChange} />
    </fieldset>
  );
}

/** «от … до …»: applied on Enter or when the field loses focus, not on every keystroke */
function RangeInputs({ value, bounds, onChange }: { value: Range; bounds: { min: number; max: number } | null; onChange: (r: Range) => void }) {
  const [min, setMin] = useState(value.min?.toString() ?? '');
  const [max, setMax] = useState(value.max?.toString() ?? '');
  useEffect(() => {
    setMin(value.min?.toString() ?? '');
    setMax(value.max?.toString() ?? '');
  }, [value.min, value.max]);

  const parse = (s: string) => {
    const n = Number(s.replace(',', '.').replace(/\s/g, ''));
    return s.trim() === '' || !Number.isFinite(n) ? undefined : n;
  };
  const commit = () => {
    const next = { min: parse(min), max: parse(max) };
    if (next.min !== value.min || next.max !== value.max) onChange(next);
  };
  const fmt = (n: number) => String(Math.round(n * 10) / 10);

  return (
    <div className="range-inputs">
      <input
        className="input input--sm"
        inputMode="decimal"
        placeholder={bounds ? `от ${fmt(bounds.min)}` : 'от'}
        aria-label="от"
        value={min}
        onChange={(e) => setMin(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
      <span aria-hidden="true">—</span>
      <input
        className="input input--sm"
        inputMode="decimal"
        placeholder={bounds ? `до ${fmt(bounds.max)}` : 'до'}
        aria-label="до"
        value={max}
        onChange={(e) => setMax(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
    </div>
  );
}

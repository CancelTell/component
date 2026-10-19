'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { categoryById } from '@/data/categories';
import type { Product } from '@/data/types';
import { findSpec, productSummary, sortProducts, type SortState } from '@/lib/catalog';
import { bestOffer, getCategoryProducts, useCatalog } from '@/lib/catalog-client';
import { assessCandidate, slotCategory, slotLabel, type Build, type SlotId } from '@/lib/compatibility';
import { normalizeQuery } from '@/lib/search';
import { HAS_PRICES } from '@/lib/pricing';
import { modelsLabel } from '@/lib/format';
import { Sheet } from '@/components/ui/Sheet';
import { Switch } from '@/components/ui/Switch';
import { PriceLine } from '@/components/catalog/PriceLine';
import { StatusBadge } from './CheckList';

const PAGE = 30;
const priceOf = (p: Product) => bestOffer(p.slug)?.price ?? null;

interface Props {
  slot: SlotId | null;
  build: Build;
  onPick: (slot: SlotId, product: Product) => void;
  onClose: () => void;
}

/**
 * Choosing a part: search, brand, sort and «Только совместимые». Every model shows how it fits
 * the parts already chosen, with the reason in one line.
 */
export function PartPicker({ slot, build, onPick, onClose }: Props) {
  return (
    <Sheet open={slot !== null} variant="side" title={slot ? `${slotLabel(slot, categoryById[slotCategory(slot)].singular)}: выбор` : ''} onClose={onClose}>
      {slot && <PickerBody key={slot} slot={slot} build={build} onPick={onPick} onClose={onClose} />}
    </Sheet>
  );
}

function PickerBody({ slot, build, onPick, onClose }: Props & { slot: SlotId }) {
  const category = slotCategory(slot);
  const config = categoryById[category];
  const ready = useCatalog([category]);
  const all = ready ? getCategoryProducts(category) : [];
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState<string | null>(null);
  const [onlyCompatible, setOnlyCompatible] = useState(true);
  const [sortId, setSortId] = useState('popular');
  const [shown, setShown] = useState(PAGE);

  const others = Object.entries(build).filter(([s, p]) => s !== slot && p).length;
  const sortChoices = useMemo(
    () => [
      { id: 'popular', label: 'Популярные', sort: { key: 'popular', dir: 'asc' } as SortState },
      ...(HAS_PRICES ? [{ id: 'price', label: 'Дешевле', sort: { key: 'price', dir: 'asc' } as SortState }] : []),
      ...config.tableSpecs.flatMap((k) => {
        const def = findSpec(config, k);
        return def?.mono ? [{ id: k, label: def.short ?? def.label, sort: { key: k, dir: def.better === 'lower' ? 'asc' : 'desc' } as SortState }] : [];
      }),
      { id: 'name', label: 'По названию', sort: { key: 'name', dir: 'asc' } as SortState },
    ],
    [config],
  );

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of all) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b);
  }, [all]);

  const rows = useMemo(() => {
    const words = normalizeQuery(query).split(' ').filter(Boolean);
    const assessed = all
      .filter((p) => !brand || p.brand === brand)
      .filter((p) => {
        if (!words.length) return true;
        const text = normalizeQuery(`${p.brand} ${p.name} ${productSummary(p)}`);
        return words.every((w) => text.includes(w));
      })
      .map((p) => ({ p, check: others ? assessCandidate(build, slot, p) : null }));
    const sort = sortChoices.find((s) => s.id === sortId)?.sort ?? sortChoices[0]!.sort;
    const order = new Map(sortProducts(assessed.map((r) => r.p), sort, priceOf).map((p, i) => [p.slug, i]));
    return assessed.sort((a, b) => order.get(a.p.slug)! - order.get(b.p.slug)!);
  }, [all, brand, query, others, build, slot, sortChoices, sortId]);

  const hidden = onlyCompatible ? rows.filter((r) => r.check?.status === 'fail').length : 0;
  const list = onlyCompatible ? rows.filter((r) => r.check?.status !== 'fail') : rows;
  const current = build[slot]?.slug;

  return (
    <div className="picker">
      <div className="picker__tools">
        <label className="field field--sm">
          <Search size={18} className="field__icon" aria-hidden="true" />
          <span className="visually-hidden">Поиск модели</span>
          <input
            className="field__input"
            type="search"
            placeholder={`Модель или характеристика, например ${config.quick[0]?.[1] ?? ''}`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            autoComplete="off"
          />
        </label>
        <div className="picker__row">
          <Switch checked={onlyCompatible} onChange={setOnlyCompatible} label="Только совместимые" />
          <label>
            <span className="visually-hidden">Сортировка</span>
            <select className="select select--sm" value={sortId} onChange={(e) => setSortId(e.target.value)}>
              {sortChoices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {brands.length > 1 && (
          <div className="chips chips--scroll" role="group" aria-label="Бренд">
            <button type="button" className={`chip chip--sm${brand === null ? ' chip--active' : ''}`} aria-pressed={brand === null} onClick={() => setBrand(null)}>
              Все
            </button>
            {brands.map((b) => (
              <button key={b} type="button" className={`chip chip--sm${brand === b ? ' chip--active' : ''}`} aria-pressed={brand === b} onClick={() => setBrand(b === brand ? null : b)}>
                {b}
              </button>
            ))}
          </div>
        )}
        <p className="picker__count" aria-live="polite">
          {!ready
            ? 'Загружаем модели…'
            : others && onlyCompatible
              ? `Подходят: ${list.length}${hidden ? ` · скрыто несовместимых: ${hidden}` : ''}`
              : modelsLabel(list.length)}
        </p>
      </div>

      <ul className="picker__list" role="list">
        {list.slice(0, shown).map(({ p, check }) => (
          <li key={p.slug}>
            <button
              type="button"
              className="picker__item"
              aria-pressed={current === p.slug}
              onClick={() => {
                onPick(slot, p);
                onClose();
              }}
            >
              <span className="picker__main">
                <span className="picker__name">
                  {p.brand} {p.name}
                </span>
                <span className="picker__sub">{productSummary(p)}</span>
                {check && check.status !== 'ok' && <span className={`picker__why picker__why--${check.status}`}>{check.message}</span>}
              </span>
              <span className="picker__side">
                {check && <StatusBadge status={check.status} />}
                <PriceLine slug={p.slug} store={false} className="picker__price" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {list.length > shown && (
        <button type="button" className="btn btn--outline btn--block" onClick={() => setShown((n) => n + PAGE)}>
          Показать ещё {Math.min(PAGE, list.length - shown)}
        </button>
      )}
      {ready && list.length === 0 && (
        <p className="picker__empty">
          {hidden ? 'Совместимых моделей под эти условия нет. Выключите «Только совместимые», чтобы увидеть остальные с причиной.' : 'Ничего не нашлось, измените запрос.'}
        </p>
      )}
    </div>
  );
}

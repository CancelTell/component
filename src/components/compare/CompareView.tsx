'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Scale, X } from 'lucide-react';
import { categoryById } from '@/data';
import type { CategoryId, Product, SpecDef } from '@/data/types';
import { allSpecs, productHref, productMeta } from '@/lib/catalog';
import { COMPARE_LIMIT, useCompare } from '@/lib/compare-store';
import { formatSpec, modelsLabel, rankSpec } from '@/lib/format';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';
import { Switch } from '@/components/ui/Switch';

interface Row {
  def: SpecDef;
  values: string[];
  diff: boolean;
  best: boolean[];
}

function buildRows(models: Product[], defs: SpecDef[]): Row[] {
  return defs.map((def) => {
    const values = models.map((m) => formatSpec(m, def));
    const diff = models.length > 1 && new Set(values).size > 1;
    let best = models.map(() => false);
    if (diff && def.better) {
      const ranks = models.map((m) => rankSpec(m, def));
      const valid = ranks.filter((r): r is number => r !== null && !Number.isNaN(r));
      if (valid.length > 1) {
        const target = def.better === 'higher' ? Math.max(...valid) : Math.min(...valid);
        best = ranks.map((r) => r === target);
      }
    }
    return { def, values, diff, best };
  });
}

export function CompareView() {
  const searchParams = useSearchParams();
  const { items, remove, clear } = useCompare();
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [picked, setPicked] = useState<CategoryId | undefined>(
    () => (searchParams.get('category') as CategoryId | null) ?? undefined,
  );

  const present = [...new Set(items.map((p) => p.category))];
  const active = picked && present.includes(picked) ? picked : present[0];
  const config = active ? categoryById[active] : undefined;
  const models = active ? items.filter((p) => p.category === active) : [];

  const crumbs: Crumb[] = [{ label: 'Главная', href: '/' }];
  if (config) crumbs.push({ label: config.name, href: `/catalog/${config.id}` });
  crumbs.push({ label: 'Сравнение' });

  if (!config || models.length === 0) {
    return (
      <>
        <Breadcrumbs items={crumbs} />
        <div className="page__head">
          <h1 className="title-1">Сравнение</h1>
        </div>
        <div className="card empty-card">
          <span className="empty-card__icon">
            <Scale size={32} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <p className="title-3">Пока нечего сравнивать</p>
          <p className="empty-card__text">
            Добавьте до {COMPARE_LIMIT} моделей одной категории кнопкой «В сравнение» в каталоге или на странице модели.
          </p>
          <Link href="/catalog" className="btn btn--accent">
            Перейти в каталог
          </Link>
        </div>
      </>
    );
  }

  const rows = buildRows(models, allSpecs(config));
  const visibleRows = onlyDiff ? rows.filter((r) => r.diff) : rows;
  const canAdd = models.length < COMPARE_LIMIT;
  const addHref = `/catalog/${config.id}`;

  return (
    <>
      <Breadcrumbs items={crumbs} />

      <div className="compare-head">
        <div>
          <h1 className="title-1">Сравнение</h1>
          <p className="text-muted">
            {config.name} · {modelsLabel(models.length)}
          </p>
        </div>
        <div className="compare-head__tools">
          <Switch checked={onlyDiff} onChange={setOnlyDiff} label="Только различия" />
          <button type="button" className="btn btn--outline" onClick={() => clear(config.id)}>
            Очистить
          </button>
        </div>
      </div>

      {present.length > 1 && (
        <div className="chips compare-tabs" role="tablist" aria-label="Категории в сравнении">
          {present.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === active}
              className={`chip${id === active ? ' chip--active' : ''}`}
              onClick={() => setPicked(id)}
            >
              {categoryById[id].name}
              <span className="mono">{items.filter((p) => p.category === id).length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="card compare-table-wrap">
        <table className="compare-table" style={{ '--cols': models.length + (canAdd ? 1 : 0) } as CSSProperties}>
          <caption className="visually-hidden">Сравнение характеристик: {config.name}</caption>
          <colgroup>
            <col className="compare-table__label-col" />
            {models.map((m) => (
              <col key={m.slug} />
            ))}
            {canAdd && <col className="compare-table__add-col" />}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Модель</th>
              {models.map((m) => (
                <th key={m.slug} scope="col">
                  <span className="compare-model__meta">{productMeta(m)}</span>
                  <Link href={productHref(m)} className="compare-model__name">
                    {m.name}
                  </Link>
                  <button type="button" className="compare-model__remove" onClick={() => remove(m.slug)}>
                    <X size={12} strokeWidth={2.5} aria-hidden="true" />
                    Убрать
                  </button>
                </th>
              ))}
              {canAdd && (
                <td className="compare-table__add compare-table__add-col">
                  <Link href={addHref} className="compare-add">
                    <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
                    Добавить модель
                  </Link>
                </td>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.def.key}>
                <th scope="row">{row.def.label}</th>
                {row.values.map((v, i) => (
                  <td
                    key={models[i]!.slug}
                    className={[row.diff && 'is-diff', row.best[i] && 'is-best', row.def.mono && 'mono'].filter(Boolean).join(' ') || undefined}
                  >
                    {v}
                  </td>
                ))}
                {canAdd && <td className="compare-table__add-col" />}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={models.length + 2} className="text-muted">
                  Различий нет — модели совпадают по всем характеристикам.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="compare-note">Цветом подсвечены строки с различиями, жирным выделено лучшее значение.</p>
      {canAdd && (
        <Link href={addHref} className="btn btn--outline btn--block compare-add-mobile">
          <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          Добавить модель
        </Link>
      )}
    </>
  );
}

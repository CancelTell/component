'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { Crown, Plus, Scale, X } from 'lucide-react';
import { categoryById } from '@/data';
import type { CategoryId, Product, SpecDef } from '@/data/types';
import { productHref, productMeta } from '@/lib/catalog';
import { COMPARE_LIMIT, useCompare } from '@/lib/compare-store';
import { formatSpec, modelsLabel, pluralize, rankSpec } from '@/lib/format';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';
import { ComponentArt } from '@/components/ui/ComponentArt';
import { Switch } from '@/components/ui/Switch';

/** One color per comparison slot — used for dots, bars and model cards */
const SLOT_COLORS = ['#ff8a6b', '#a78bfa', '#5fd4bf', '#f5b94e'];

interface Row {
  def: SpecDef;
  values: string[];
  /** 0..1 bar length per model, null when the value isn't numeric */
  bars: Array<number | null>;
  diff: boolean;
  best: boolean[];
}

function buildRow(models: Product[], def: SpecDef): Row {
  const values = models.map((m) => formatSpec(m, def));
  const ranks = models.map((m) => rankSpec(m, def));
  const numeric = ranks.filter((r): r is number => r !== null && !Number.isNaN(r));
  const max = numeric.length ? Math.max(...numeric) : 0;
  const diff = models.length > 1 && new Set(values).size > 1;
  // Bars only where they tell something: differing magnitudes (not dates, not equal values)
  const showBars = diff && def.key !== 'year';
  const bars = ranks.map((r) =>
    showBars && r !== null && !Number.isNaN(r) && max > 0 ? Math.max(0.06, r / max) : null,
  );

  let best = models.map(() => false);
  if (diff && def.better && numeric.length > 1) {
    const target = def.better === 'higher' ? max : Math.min(...numeric);
    best = ranks.map((r) => r === target);
  }
  return { def, values, bars, diff, best };
}

export function CompareView() {
  const searchParams = useSearchParams();
  const { items, remove, clear } = useCompare();
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
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

  const groups = config.groups.map((g) => ({ title: g.title, rows: g.specs.map((def) => buildRow(models, def)) }));
  const allRows = groups.flatMap((g) => g.rows);
  const wins = models.map((_, i) => allRows.filter((r) => r.best[i]).length);
  const topWins = Math.max(...wins);
  const leader = topWins > 0 && wins.filter((w) => w === topWins).length === 1 ? wins.indexOf(topWins) : -1;
  const canAdd = models.length < COMPARE_LIMIT;
  const addHref = `/catalog/${config.id}`;
  const cols = models.length + (canAdd ? 1 : 0);

  const removeAnimated = (slug: string) => {
    setLeaving(slug);
    window.setTimeout(() => {
      remove(slug);
      setLeaving(null);
    }, 280);
  };

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
              <span>{items.filter((p) => p.category === id).length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="cmp" style={{ ['--cols' as string]: cols } as CSSProperties}>
        {/* Model cards */}
        <div className="cmp__models">
          <div className="cmp__corner">
            <span className="cmp__corner-title">Модели</span>
            <span className="text-muted">Победы по параметрам</span>
          </div>
          {models.map((m, i) => (
            <article
              key={m.slug}
              className={`cmp-model${leaving === m.slug ? ' is-leaving' : ''}${i === leader ? ' is-leader' : ''}`}
              style={{ ['--mc' as string]: SLOT_COLORS[i], ['--i' as string]: i } as CSSProperties}
            >
              <div className="cmp-model__art">
                <ComponentArt name={config.icon} className="art--draw" />
              </div>
              <button
                type="button"
                className="cmp-model__remove"
                onClick={() => removeAnimated(m.slug)}
                aria-label={`Убрать ${m.name} из сравнения`}
              >
                <X size={14} />
              </button>
              <span className="cmp-model__meta">{productMeta(m)}</span>
              <Link href={productHref(m)} className="cmp-model__name">
                {m.name}
              </Link>
              <span className="cmp-model__wins">
                {i === leader && <Crown size={14} aria-hidden="true" />}
                {wins[i]} {pluralize(wins[i]!, ['победа', 'победы', 'побед'])}
              </span>
            </article>
          ))}
          {canAdd && (
            <Link href={addHref} className="cmp-add">
              <span className="cmp-add__icon">
                <Plus size={20} />
              </span>
              Добавить модель
            </Link>
          )}
        </div>

        {/* Spec groups */}
        {groups.map((group) => {
          const rows = onlyDiff ? group.rows.filter((r) => r.diff) : group.rows;
          if (rows.length === 0) return null;
          return (
            <section key={group.title} className="cmp__group" aria-label={group.title}>
              <h2 className="cmp__group-title">{group.title}</h2>
              {rows.map((row, r) => (
                <div key={row.def.key} className={`cmp__row${row.diff ? ' is-diff' : ''}`}>
                  <div className="cmp__label">{row.def.label}</div>
                  {models.map((m, i) => (
                    <div
                      key={m.slug}
                      className={`cmp__cell${row.best[i] ? ' is-best' : ''}${leaving === m.slug ? ' is-leaving' : ''}`}
                      style={{ ['--mc' as string]: SLOT_COLORS[i], ['--r' as string]: r } as CSSProperties}
                    >
                      <span className="cmp__who">{m.name}</span>
                      <span className={`cmp__value${row.def.mono ? ' mono' : ''}`}>
                        {row.values[i]}
                        {row.best[i] && <span className="cmp__best">лучше</span>}
                      </span>
                      {row.bars[i] !== null && (
                        <span className="cmp__bar">
                          <span style={{ ['--w' as string]: row.bars[i] } as CSSProperties} />
                        </span>
                      )}
                    </div>
                  ))}
                  {canAdd && <div className="cmp__spacer" />}
                </div>
              ))}
            </section>
          );
        })}

        {onlyDiff && allRows.every((r) => !r.diff) && (
          <p className="cmp__empty text-muted">Эти модели совпадают по всем характеристикам.</p>
        )}
      </div>

      <p className="compare-note">
        Длина полосы показывает величину значения. Метка «лучше» стоит у лучшего значения в строке, строки с
        различиями подсвечены.
      </p>
    </>
  );
}

'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';
import { presets } from '@/data/presets';
import { autoBuild, minBudget } from '@/lib/auto-build';
import { useBuild } from '@/lib/build-store';
import { buildProducts } from '@/lib/cart-store';
import { priceBuild, rub } from '@/lib/pricing';

const MAX = 300000;
const STEP = 5000;

/** Start from a ready-made build or let the site pick one for a budget */
export function BuildStarter() {
  const { load } = useBuild();
  const min = useMemo(minBudget, []);
  const [budget, setBudget] = useState(100000);
  const [status, setStatus] = useState<string | null>(null);
  const value = Math.max(budget, min);
  const fill = ((value - min) / (MAX - min)) * 100;

  const pick = () => {
    const result = autoBuild(value);
    if (!result) {
      setStatus(`В ${rub(value)} совместимую сборку не собрать, минимум ${rub(min)}`);
      return;
    }
    load(result.slots);
    setStatus(`Подобрали за ${rub(result.total)}. Детали можно поменять ниже`);
  };

  return (
    <section className="card starter" aria-label="Быстрый старт">
      <div className="starter__block">
        <p className="starter__label">Начать с готовой</p>
        <div className="starter__presets">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className="starter__preset"
              title={p.note}
              onClick={() => {
                load(p.slots);
                setStatus(`Загружена сборка «${p.name}»`);
              }}
            >
              <b>{p.name}</b>
              <span>{rub(priceBuild(buildProducts(p.slots)).split.total)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="starter__block starter__budget">
        <label htmlFor="budget" className="starter__label">
          Подобрать под бюджет <b className="starter__value">до {rub(value)}</b>
        </label>
        <div className="starter__row">
          <input
            id="budget"
            type="range"
            className="range"
            min={min}
            max={MAX}
            step={STEP}
            value={value}
            onChange={(e) => setBudget(Number(e.target.value))}
            style={{ ['--fill' as string]: `${fill}%` } as CSSProperties}
          />
          <button type="button" className="btn btn--outline starter__go" onClick={pick}>
            <Sparkles size={16} aria-hidden="true" />
            Подобрать
          </button>
        </div>
      </div>

      {status && (
        <p className="starter__status" role="status">
          {status}
        </p>
      )}
    </section>
  );
}

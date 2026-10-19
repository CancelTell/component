'use client';

import { useState, type CSSProperties } from 'react';
import { presets } from '@/data/presets';
import type { IconName } from '@/data/types';
import { artStyle } from '@/components/ui/ComponentArt';
import { autoBuild } from '@/lib/auto-build';
import { useBuild } from '@/lib/build-store';
import { useCatalog } from '@/lib/catalog-client';
import { buildCategories } from '@/lib/compatibility';
import { HAS_PRICES, rub } from '@/lib/pricing';

const tones: IconName[] = ['ram', 'storage', 'gpu', 'cpu'];
const MIN = 40000;
const MAX = 300000;
const STEP = 5000;

/** Start from a ready-made build; with store prices, also pick one for a budget */
export function BuildStarter() {
  const { load } = useBuild();
  const [status, setStatus] = useState<string | null>(null);

  return (
    <section className="starter" aria-label="Быстрый старт">
      <div className="starter__presets">
        <span className="starter__label">Начать с готовой:</span>
        {presets.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className="chip starter__preset"
            style={artStyle(tones[i % tones.length]!)}
            title={p.note}
            onClick={() => {
              load(p.slots);
              setStatus(`Загружена сборка «${p.name}». Меняйте детали — проверки обновятся сразу`);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
      {HAS_PRICES ? <Budget onPicked={setStatus} /> : null}
      {status && (
        <p className="starter__status" role="status">
          {status}
        </p>
      )}
    </section>
  );
}

function Budget({ onPicked }: { onPicked: (text: string) => void }) {
  const { load } = useBuild();
  const ready = useCatalog(buildCategories);
  const [budget, setBudget] = useState(100000);
  const fill = ((budget - MIN) / (MAX - MIN)) * 100;
  const pick = () => {
    const result = autoBuild(budget);
    if (!result) return onPicked(`В ${rub(budget)} совместимую сборку из того, что есть в наличии, не собрать`);
    load(result.slots);
    onPicked(`Подобрали за ${rub(result.total)}. Детали можно поменять`);
  };
  return (
    <div className="starter__budget">
      <label htmlFor="budget" className="starter__label">
        Под бюджет до <b className="num">{rub(budget)}</b>
      </label>
      <input
        id="budget"
        type="range"
        className="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={budget}
        onChange={(e) => setBudget(Number(e.target.value))}
        style={{ ['--fill' as string]: `${fill}%` } as CSSProperties}
      />
      <button type="button" className="btn btn--outline btn--sm" disabled={!ready} onClick={pick}>
        Подобрать
      </button>
    </div>
  );
}

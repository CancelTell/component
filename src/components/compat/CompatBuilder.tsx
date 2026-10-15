'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Minus, X } from 'lucide-react';
import { categoryById, getProduct, getProductsByCategory } from '@/data';
import { productSummary } from '@/lib/catalog';
import { useBuild } from '@/lib/build-store';
import { useCompare } from '@/lib/compare-store';
import {
  assessCandidate,
  buildSlots,
  isSlot,
  runChecks,
  type CheckStatus,
  type SlotId,
} from '@/lib/compatibility';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Sheet } from '@/components/ui/Sheet';

function StatusIcon({ status }: { status: CheckStatus }) {
  const icon = {
    ok: <Check size={14} strokeWidth={3} />,
    fail: <X size={14} strokeWidth={3} />,
    warn: <span className="status-icon__mark">!</span>,
    pending: <Minus size={12} strokeWidth={2.5} />,
  }[status];
  return (
    <span className={`status-icon status-icon--${status}`} aria-hidden="true">
      {icon}
    </span>
  );
}

const statusText: Record<CheckStatus, string> = {
  ok: 'совместимо',
  warn: 'есть замечание',
  fail: 'несовместимо',
  pending: 'не проверено',
};

export function CompatBuilder() {
  const addSlug = useSearchParams().get('add');
  const { build, select, clearSlot, reset } = useBuild();
  const { add } = useCompare();
  const [picking, setPicking] = useState<SlotId | null>(null);

  // Preselect a model passed from the model page (?add=slug)
  useEffect(() => {
    if (!addSlug) return;
    const product = getProduct(addSlug);
    if (product && isSlot(product.category)) select(product.category, product);
    window.history.replaceState(window.history.state, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSlug]);

  const checks = runChecks(build);
  const done = checks.filter((c) => c.status !== 'pending').length;
  const hasFail = checks.some((c) => c.status === 'fail');
  const selected = buildSlots.flatMap((s) => (build[s] ? [build[s]!] : []));
  const closePicker = useCallback(() => setPicking(null), []);

  return (
    <div className="compat">
      <ul className="compat__slots" role="list" aria-label="Комплектующие">
        {buildSlots.map((slot) => {
          const config = categoryById[slot];
          const product = build[slot];
          const failing = !!product && checks.some((c) => c.status === 'fail' && c.slots.includes(slot));
          return (
            <li
              key={slot}
              className={`card slot${product ? ' slot--filled' : ''}${failing ? ' slot--fail' : ''}`}
            >
              <span className="icon-box icon-box--muted">
                <CategoryIcon name={config.icon} />
              </span>
              <div className="slot__text">
                <span className="slot__label">{config.singular}</span>
                {product ? (
                  <>
                    <span className="slot__value">{product.name}</span>
                    <span className="slot__sub">{productSummary(product)}</span>
                  </>
                ) : (
                  <span className="slot__value slot__value--empty">Не выбрано</span>
                )}
              </div>
              <div className="slot__actions">
                {product ? (
                  <>
                    <button type="button" className="btn btn--ghost slot__change" onClick={() => setPicking(slot)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost slot__clear"
                      aria-label={`Убрать: ${config.singular}`}
                      onClick={() => clearSlot(slot)}
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn--outline" onClick={() => setPicking(slot)}>
                    Выбрать
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <section className="card result compat__result" aria-labelledby="result-title">
        <h2 id="result-title" className="result__title">
          Результат
        </h2>
        <div>
          <p className="result__progress-label">
            Проверено {done} из {checks.length}
          </p>
          <div
            className="result__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={checks.length}
            aria-valuenow={done}
            aria-label="Прогресс проверки"
          >
            <div
              className={`result__bar-fill${hasFail ? ' result__bar-fill--fail' : ''}`}
              style={{ width: `${(done / checks.length) * 100}%` }}
            />
          </div>
        </div>
        <ul className="result__list" role="list" aria-live="polite">
          {checks.map((c) => (
            <li key={c.id} className={`check check--${c.status}`}>
              <StatusIcon status={c.status} />
              <div>
                <span className="check__title">
                  {c.title}
                  <span className="visually-hidden">: {statusText[c.status]}</span>
                </span>
                <span className="check__msg">{c.message}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="result__actions">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={selected.length === 0}
            onClick={() => selected.forEach(add)}
          >
            Добавить в сравнение
          </button>
          <button type="button" className="btn btn--outline" disabled={selected.length === 0} onClick={reset}>
            Сбросить
          </button>
        </div>
      </section>

      <Sheet open={picking !== null} title={picking ? `${categoryById[picking].singular}: выбор` : ''} onClose={closePicker}>
        {picking && (
          <ul className="picker__list" role="list">
            {getProductsByCategory(picking).map((p) => {
              const issue = assessCandidate(build, picking, p);
              const current = build[picking]?.slug === p.slug;
              const tone = issue?.status ?? 'pending';
              return (
                <li key={p.slug}>
                  <button
                    type="button"
                    className="picker__item"
                    aria-pressed={current}
                    onClick={() => {
                      select(picking, p);
                      closePicker();
                    }}
                  >
                    <span className="picker__main">
                      <span className="picker__name">
                        {p.brand} {p.name}
                      </span>
                      <span className="picker__sub">{productSummary(p)}</span>
                    </span>
                    {issue && (
                      <span className={`picker__status picker__status--${tone}`}>
                        {tone === 'ok' ? 'Подходит' : issue.message}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </div>
  );
}

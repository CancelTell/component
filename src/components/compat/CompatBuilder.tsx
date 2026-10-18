'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Minus, Share2, ShoppingCart, X } from 'lucide-react';
import { categoryById, getProduct, getProductsByCategory } from '@/data';
import { productSummary } from '@/lib/catalog';
import { useBuild } from '@/lib/build-store';
import { useCompare } from '@/lib/compare-store';
import { suggestName, useCart } from '@/lib/cart-store';
import { parseShared, shareBuild } from '@/lib/share';
import { useToast } from '@/components/ui/Toast';
import { flyToCart } from '@/lib/fly-to-compare';
import { priceBuild, rub } from '@/lib/pricing';
import { bestOffer } from '@/data/offers';
import { OFFERS_ARE_DEMO } from '@/data/offers';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';
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

function SlotPrice({ slug }: { slug: string }) {
  const best = bestOffer(slug);
  return (
    <span className="slot__price">{best ? `от ${rub(best.price!)} · ${best.store}` : 'нет в наличии'}</span>
  );
}

const statusText: Record<CheckStatus, string> = {
  ok: 'совместимо',
  warn: 'есть замечание',
  fail: 'несовместимо',
  pending: 'не проверено',
};

export function CompatBuilder() {
  const params = useSearchParams();
  const addSlug = params.get('add');
  const sharedParam = params.get('build');
  const { build, slugs, select, clearSlot, reset, load } = useBuild();
  const toast = useToast();
  const { add } = useCompare();
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const artRef = useRef<HTMLSpanElement>(null);
  const [picking, setPicking] = useState<SlotId | null>(null);

  // Preselect a model passed from the model page (?add=slug)
  useEffect(() => {
    if (!addSlug) return;
    const product = getProduct(addSlug);
    if (product && isSlot(product.category)) select(product.category, product);
    window.history.replaceState(window.history.state, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSlug]);

  // Open a build shared by link (?build=cpu:slug,gpu:slug)
  useEffect(() => {
    const shared = parseShared(sharedParam);
    if (!shared) return;
    load(shared);
    toast.show('Открыта сборка по ссылке');
    window.history.replaceState(window.history.state, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedParam]);

  const share = async () => {
    const result = await shareBuild(slugs, suggestName(slugs, 1));
    if (result === 'copied') toast.show('Ссылка на сборку скопирована');
    else if (result === 'failed') toast.show('Не получилось скопировать ссылку');
  };

  const checks = runChecks(build);
  const done = checks.filter((c) => c.status !== 'pending').length;
  const hasFail = checks.some((c) => c.status === 'fail');
  const selected = buildSlots.flatMap((s) => (build[s] ? [build[s]!] : []));
  const closePicker = useCallback(() => setPicking(null), []);
  const price = priceBuild(selected);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2400);
    return () => window.clearTimeout(t);
  }, [added]);

  const addToCart = (e: MouseEvent<HTMLButtonElement>) => {
    cart.add(slugs);
    flyToCart(e.currentTarget, artRef.current);
    setAdded(true);
  };

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
                    <SlotPrice slug={product.slug} />
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
        {selected.length > 0 && (
          <div className="result__price">
            <span className="result__price-art" ref={artRef} style={artStyle('case')} aria-hidden="true">
              <ComponentArt name="case" />
            </span>
            <div>
              <p className="result__price-label">
                Цена комплекта{OFFERS_ARE_DEMO && <span className="demo-badge">демо</span>}
              </p>
              <p className="result__price-value">
                {price.split.missing.length === selected.length ? 'нет в наличии' : `от ${rub(price.split.total)}`}
              </p>
              <p className="result__price-sub">
                {price.split.missing.length > 0
                  ? `Нет в наличии: ${price.split.missing.length} из ${selected.length}`
                  : price.bestSingle
                    ? `Одним заказом — ${price.bestSingle.store.name}, ${rub(price.bestSingle.total)}`
                    : `Частями в ${price.split.storesUsed} магазинах`}
              </p>
            </div>
          </div>
        )}
        <div className="result__actions">
          <button type="button" className="btn btn--accent result__cart" disabled={selected.length === 0} onClick={addToCart}>
            {added ? <Check size={18} aria-hidden="true" /> : <ShoppingCart size={18} aria-hidden="true" />}
            {added ? 'Сборка в корзине' : 'В корзину'}
          </button>
          {added && (
            <Link href="/cart" className="link result__cart-link">
              Открыть корзину
            </Link>
          )}
          <button type="button" className="btn btn--outline result__share" disabled={selected.length === 0} onClick={share}>
            <Share2 size={18} aria-hidden="true" />
            Поделиться
          </button>
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

      {toast.node}

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

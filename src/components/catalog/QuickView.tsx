'use client';

import Link from 'next/link';
import { forwardRef, useEffect, useState, type CSSProperties } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { categoryById } from '@/data';
import type { Product } from '@/data/types';
import { getStats, productHref, productMeta } from '@/lib/catalog';
import { isSlot } from '@/lib/compatibility';
import { formatSpec } from '@/lib/format';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';
import { Stat } from '@/components/ui/Stat';
import { Availability } from '@/components/product/Availability';
import { CompareButton } from './CompareButton';

interface Props {
  product: Product;
  /** Column of the selected card, for the pointer notch */
  column: number;
  columns: number;
  position: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Quick view that opens inline, right under the row of the clicked card (like image search results).
 * Everything stays in one page scroll; arrows switch models without closing.
 */
export const QuickView = forwardRef<HTMLDivElement, Props>(function QuickView(
  { product, column, columns, position, total, onClose, onPrev, onNext },
  ref,
) {
  const config = categoryById[product.category];
  const specs = config.groups.flatMap((g) => g.specs).slice(0, 8);
  const [open, setOpen] = useState(false);

  // Expand on the next frame so the height transition runs
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const notch = { ['--notch' as string]: `${((column + 0.5) / columns) * 100}%` } as CSSProperties;

  return (
    <div ref={ref} className={`qv${open ? ' is-open' : ''}`} style={{ ...artStyle(config.icon), ...notch }}>
      <div className="qv__clip">
        <section className="qv__panel" aria-label={`Быстрый просмотр: ${product.name}`} tabIndex={-1}>
          <span className="qv__notch" aria-hidden="true" />

          <header className="qv__head">
            <div className="qv__titles" key={product.slug}>
              <p className="qv__meta">{productMeta(product)}</p>
              <h2 className="qv__title">{product.name}</h2>
            </div>
            <div className="qv__nav">
              <span className="qv__pos" aria-live="polite">
                {position} из {total}
              </span>
              <button type="button" className="qv__btn" onClick={onPrev} aria-label="Предыдущая модель" title="Предыдущая (←)">
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="qv__btn" onClick={onNext} aria-label="Следующая модель" title="Следующая (→)">
                <ChevronRight size={18} />
              </button>
              <button type="button" className="qv__btn" onClick={onClose} aria-label="Закрыть" title="Закрыть (Esc)">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="qv__body" key={product.slug}>
            <div className="qv__media">
              <ComponentArt name={config.icon} className="art--draw art--spin" />
            </div>

            <div className="qv__main">
              <div className="qv__stats">
                {getStats(product, config.keySpecs).map((s) => (
                  <Stat key={s.label} item={s} monoValue />
                ))}
              </div>
              <div className="qv__actions">
                <Link href={productHref(product)} className="btn btn--accent">
                  Все характеристики
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <CompareButton product={product} />
                {isSlot(product.category) && (
                  <Link href={`/compatibility?add=${product.slug}`} className="btn btn--ghost">
                    Совместимость
                  </Link>
                )}
              </div>
              <Availability slug={product.slug} compact />
            </div>

            <dl className="qv__specs">
              {specs.map((def) => (
                <div key={def.key} className="spec-row">
                  <dt>{def.label}</dt>
                  <dd className={def.mono ? 'mono' : undefined}>{formatSpec(product, def)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
});

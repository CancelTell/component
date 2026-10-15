import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { products } from '@/data';
import type { Product } from '@/data/types';
import { getSimilar, productHref, productSummary } from '@/lib/catalog';
import { compatSummary, isSlot } from '@/lib/compatibility';

export function ModelAside({ product }: { product: Product }) {
  const { text, chips } = compatSummary(product, products);
  const similar = getSimilar(product);

  return (
    <aside className="model-aside" aria-label="Дополнительно">
      <section className="card side-card" aria-labelledby="compat-title">
        <h2 id="compat-title" className="side-card__title">
          Совместимость
        </h2>
        <p className="side-card__text">{text}</p>
        {chips.length > 0 && (
          <ul className="chips" role="list">
            {chips.map((chip) =>
              typeof chip === 'string' ? (
                <li key={chip} className="chip chip--static">
                  {chip}
                </li>
              ) : (
                <li key={chip.slug}>
                  <Link href={productHref(chip)} className="chip">
                    {chip.name}
                  </Link>
                </li>
              ),
            )}
          </ul>
        )}
        {isSlot(product.category) && (
          <Link href={`/compatibility?add=${product.slug}`} className="btn btn--ghost btn--block">
            Проверить сочетаемость
          </Link>
        )}
      </section>

      {similar.length > 0 && (
        <section className="card side-card" aria-labelledby="similar-title">
          <h2 id="similar-title" className="side-card__title">
            Похожие модели
          </h2>
          <ul className="similar-list" role="list">
            {similar.map((p) => (
              <li key={p.slug}>
                <Link href={productHref(p)} className="similar">
                  <span>
                    <span className="similar__name">{p.name}</span>
                    <span className="similar__sub">{productSummary(p)}</span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

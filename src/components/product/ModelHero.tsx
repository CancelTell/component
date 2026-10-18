import Link from 'next/link';
import { categoryById } from '@/data';
import type { Product } from '@/data/types';
import { getStats } from '@/lib/catalog';
import { isSlot } from '@/lib/compatibility';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Stat } from '@/components/ui/Stat';
import { CompareButton } from '@/components/catalog/CompareButton';

export function ModelHero({ product }: { product: Product }) {
  const config = categoryById[product.category];
  const meta = [...config.meta(product), product.category === 'cpu' ? String(product.specs.arch ?? '') : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="card model-hero" aria-labelledby="model-title">
      <div className="model-hero__image" role="img" aria-label={`${config.singular} ${product.name}, изображение появится позже`}>
        <CategoryIcon name={config.icon} strokeWidth={0.75} />
      </div>
      <div>
        <p className="model-hero__meta">{meta}</p>
        <h1 id="model-title" className="model-hero__title">
          {product.name}
        </h1>
        <div className="model-hero__stats">
          {getStats(product, config.keySpecs).map((s) => (
            <Stat key={s.label} item={s} monoValue />
          ))}
        </div>
        <div className="model-hero__actions">
          {isSlot(product.category) && (
            <Link href={`/compatibility?add=${product.slug}`} className="btn btn--accent">
              Проверить сочетаемость
            </Link>
          )}
          <CompareButton product={product} />
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { categoryById } from '@/data';
import type { Product } from '@/data/types';
import { getStats, productHref, productMeta } from '@/lib/catalog';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Stat } from '@/components/ui/Stat';
import { CompareButton } from './CompareButton';

export function ProductCard({ product, headingLevel = 'h2' }: { product: Product; headingLevel?: 'h2' | 'h3' }) {
  const config = categoryById[product.category];
  const Heading = headingLevel;

  return (
    <article className="card product-card">
      <div className="product-card__head">
        <span className="icon-box icon-box--card">
          <CategoryIcon name={config.icon} size={28} strokeWidth={1.75} />
        </span>
        <div className="product-card__title">
          <p className="product-card__meta">{productMeta(product)}</p>
          <Heading className="product-card__name">
            <Link href={productHref(product)} className="product-card__link">
              {product.name}
            </Link>
          </Heading>
        </div>
      </div>

      <div className="product-card__stats">
        {getStats(product, config.cardSpecs).map((s) => (
          <Stat key={s.label} item={s} />
        ))}
      </div>

      <div className="product-card__action">
        <CompareButton product={product} block />
      </div>
    </article>
  );
}

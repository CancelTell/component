import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Wrench } from 'lucide-react';
import { categoryById } from '@/data/categories';
import type { Product } from '@/data/types';
import { getStats, productHref } from '@/lib/catalog';
import { inBuild } from '@/lib/compatibility';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';
import { Stat } from '@/components/ui/Stat';
import { CompareButton } from './CompareButton';
import { PriceLine } from './PriceLine';

interface Props {
  product: Product;
  index?: number;
}

/** Catalog card: picture that draws itself on hover, platform badges, three key numbers, actions */
export function ProductCard({ product, index = 0 }: Props) {
  const config = categoryById[product.category];
  const href = productHref(product);
  const style = { ...artStyle(config.icon), ['--i' as string]: Math.min(index, 8) } as CSSProperties;
  const badges = config.meta(product).slice(1).filter(Boolean).slice(0, 2);

  return (
    <article className="pcard" style={style} data-slug={product.slug}>
      <Link href={href} className="pcard__open" aria-label={`${product.brand} ${product.name}`} />

      <div className={`pcard__media${product.image ? ' pcard__media--photo' : ''}`}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pimg" src={product.image} alt="" width={112} height={112} loading="lazy" decoding="async" />
        ) : (
          <ComponentArt name={config.icon} />
        )}
        {badges.length > 0 && (
          <span className="pcard__badges">
            {badges.map((b) => (
              <span key={b} className="pcard__badge">
                {b}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="pcard__body">
        <div>
          <p className="pcard__meta">{product.brand}</p>
          <h2 className="pcard__name">
            <Link href={href}>{product.name}</Link>
          </h2>
          <PriceLine slug={product.slug} className="pcard__price" />
        </div>
        <div className="pcard__stats">
          {getStats(product, config.cardSpecs).map((s) => (
            <Stat key={s.label} item={s} />
          ))}
        </div>
      </div>

      <div className="pcard__action">
        <CompareButton product={product} />
        {inBuild(product.category) && (
          <Link href={`/build?add=${product.category}/${product.slug}`} className="btn btn--outline btn--icon" aria-label="Добавить в конструктор" title="В конструктор">
            <Wrench size={16} />
          </Link>
        )}
      </div>
    </article>
  );
}

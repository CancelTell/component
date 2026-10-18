import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { categoryById } from '@/data';
import type { Product } from '@/data/types';
import { getStats, productHref, productMeta } from '@/lib/catalog';
import { bestOffer } from '@/data/offers';
import { rub } from '@/lib/pricing';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';
import { Stat } from '@/components/ui/Stat';
import { CompareButton } from './CompareButton';

interface Props {
  product: Product;
  index?: number;
  selected?: boolean;
  /** When set, clicking the card opens the detail panel instead of the model page */
  onOpen?: (product: Product) => void;
}

export function ProductCard({ product, index = 0, selected = false, onOpen }: Props) {
  const config = categoryById[product.category];
  const href = productHref(product);
  const offer = bestOffer(product.slug);
  const style = { ...artStyle(config.icon), ['--i' as string]: Math.min(index, 8) } as CSSProperties;

  return (
    <article className="pcard" style={style} data-selected={selected || undefined} data-slug={product.slug}>
      {onOpen ? (
        <button
          type="button"
          className="pcard__open"
          aria-label={`Подробнее: ${product.brand} ${product.name}`}
          aria-expanded={selected}
          onClick={() => onOpen(product)}
        />
      ) : (
        <Link href={href} className="pcard__open" aria-label={`${product.brand} ${product.name}`} />
      )}

      <div className="pcard__media">
        <ComponentArt name={config.icon} />
        <Link href={href} className="pcard__go" aria-label={`Страница модели ${product.name}`}>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="pcard__body">
        <div>
          <p className="pcard__meta">{productMeta(product)}</p>
          <h2 className="pcard__name">{product.name}</h2>
          <p className={`pcard__price${offer ? '' : ' is-out'}`}>
            {offer ? (
              <>
                от <b>{rub(offer.price!)}</b> <span>· {offer.store}</span>
              </>
            ) : (
              'нет в наличии'
            )}
          </p>
        </div>
        <div className="pcard__stats">
          {getStats(product, config.cardSpecs).map((s) => (
            <Stat key={s.label} item={s} />
          ))}
        </div>
      </div>

      <div className="pcard__action">
        <CompareButton product={product} block />
      </div>
    </article>
  );
}

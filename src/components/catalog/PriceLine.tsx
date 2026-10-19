'use client';

import { bestOffer } from '@/lib/catalog-client';
import { HAS_PRICES, rub } from '@/lib/pricing';

/**
 * «от 17 990 ₽ · DNS». Prices exist only when a store feed is connected (HAS_PRICES);
 * until then nothing is shown in lists — one note on the page explains it, not every row.
 */
export function PriceLine({ slug, store = true, className = 'price-line' }: { slug: string; store?: boolean; className?: string }) {
  if (!HAS_PRICES) return null;
  const offer = bestOffer(slug);
  if (!offer) return <span className={`${className} is-out`}>нет в наличии</span>;
  return (
    <span className={className}>
      от <b>{rub(offer.price!)}</b>
      {store && <span> · {offer.store}</span>}
    </span>
  );
}

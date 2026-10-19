import { stores, type StoreInfo } from '@/data/stores';
import type { Offer, Product } from '@/data/types';
import { bestOffer, getOffers } from './catalog-client';

export { HAS_PRICES, rub } from './money';

export interface PricedItem {
  product: Product;
  offers: Offer[];
  best: Offer | null;
}

export interface StoreTotal {
  store: StoreInfo;
  total: number;
  /** Items this store doesn't have in stock */
  missing: Product[];
}

export interface BuildPrice {
  items: PricedItem[];
  /** Cheapest possible: each item from the store where it's cheapest */
  split: { total: number; storesUsed: number; missing: Product[] };
  /** Totals per store, complete stores first, then by price */
  byStore: StoreTotal[];
  /** Cheapest store that has everything */
  bestSingle: StoreTotal | null;
  /** How much splitting the order saves compared to bestSingle */
  savings: number | null;
}

export function priceBuild(products: Product[]): BuildPrice {
  const items = products.map((product) => ({ product, offers: getOffers(product.slug), best: bestOffer(product.slug) }));

  const missing = items.filter((i) => !i.best).map((i) => i.product);
  const total = items.reduce((sum, i) => sum + (i.best?.price ?? 0), 0);
  const storesUsed = new Set(items.flatMap((i) => (i.best ? [i.best.storeId] : []))).size;

  const byStore = stores
    .map((store) => {
      let sum = 0;
      const lacks: Product[] = [];
      for (const i of items) {
        const o = i.offers.find((x) => x.storeId === store.id && x.inStock && x.price !== null);
        if (o) sum += o.price!;
        else lacks.push(i.product);
      }
      return { store, total: sum, missing: lacks };
    })
    .sort((a, b) => a.missing.length - b.missing.length || a.total - b.total);

  const bestSingle = items.length > 0 ? (byStore.find((s) => s.missing.length === 0) ?? null) : null;

  return {
    items,
    split: { total, storesUsed, missing },
    byStore,
    bestSingle,
    savings: bestSingle && missing.length === 0 ? bestSingle.total - total : null,
  };
}

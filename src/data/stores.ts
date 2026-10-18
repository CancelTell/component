/** Stores we compare prices in. `search` builds a link to the store's own search for a model. */
export interface StoreInfo {
  id: StoreId;
  name: string;
  /** Brand-neutral accent for charts and dots */
  color: string;
  search: (query: string) => string;
}

export type StoreId = 'dns' | 'ozon' | 'citilink' | 'mvideo';

const q = encodeURIComponent;

export const stores: StoreInfo[] = [
  { id: 'dns', name: 'DNS', color: '#f5b94e', search: (s) => `https://www.dns-shop.ru/search/?q=${q(s)}` },
  { id: 'ozon', name: 'Ozon', color: '#7aa7ff', search: (s) => `https://www.ozon.ru/search/?text=${q(s)}` },
  { id: 'citilink', name: 'Ситилинк', color: '#ff8a6b', search: (s) => `https://www.citilink.ru/search/?text=${q(s)}` },
  { id: 'mvideo', name: 'М.Видео', color: '#5fd4bf', search: (s) => `https://www.mvideo.ru/product-list-page?q=${q(s)}` },
];

export const storeById = Object.fromEntries(stores.map((s) => [s.id, s])) as Record<StoreId, StoreInfo>;

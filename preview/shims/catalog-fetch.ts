// Preview only: the static preview has no /data/*.json routes, so the data comes from the bundle.
import { categoryPayload, products } from '@/data';
import type { CategoryId, CategoryPayload } from '@/data/types';
import { toSearchEntry } from '@/lib/search';
export type { SearchEntry } from '../../src/lib/catalog-fetch';
import type { SearchEntry } from '../../src/lib/catalog-fetch';

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 60));
export const fetchCategory = (c: CategoryId): Promise<CategoryPayload> => delay(categoryPayload(c));
export const fetchSearchIndex = (): Promise<SearchEntry[]> => delay(products.map(toSearchEntry));

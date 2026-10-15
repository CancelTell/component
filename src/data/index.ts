import { cpus } from './products/cpu';
import { gpus } from './products/gpu';
import { motherboards } from './products/motherboard';
import { cases, coolers, psus, rams, storages } from './products/other';
import type { CategoryId, Product } from './types';

export { categories, categoryById, isCategoryId } from './categories';
export { chipsetsBySocket } from './products/cpu';
export type * from './types';

export const products: Product[] = [
  ...cpus,
  ...gpus,
  ...motherboards,
  ...rams,
  ...storages,
  ...psus,
  ...coolers,
  ...cases,
];

const bySlug = new Map(products.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}

export function getProductsByCategory(category: CategoryId): Product[] {
  return products
    .filter((p) => p.category === category)
    .sort((a, b) => a.popularity - b.popularity);
}

export function countByCategory(category: CategoryId): number {
  return products.reduce((acc, p) => acc + (p.category === category ? 1 : 0), 0);
}

/** Popular search queries shown on the home page and in the empty state */
export const popularQueries = ['RTX 4060', 'Ryzen 5 7600', 'DDR5', 'AM5', 'LGA1700'];

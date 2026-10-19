import type { CategoryId } from './types';

/** Header mega menu data: computed on the server (src/data/index.ts) and passed to the client header */
export interface NavCategory {
  id: CategoryId;
  count: number;
  popular: Array<{ href: string; name: string; summary: string }>;
}

import type { CategoryId, CategoryPayload } from '@/data/types';

/** Static files served by src/app/data/[file]/route.ts */
export async function fetchCategory(category: CategoryId): Promise<CategoryPayload> {
  const res = await fetch(`/data/${category}.json`);
  if (!res.ok) throw new Error(`catalog ${category}: ${res.status}`);
  return (await res.json()) as CategoryPayload;
}

export interface SearchEntry {
  slug: string;
  category: CategoryId;
  brand: string;
  name: string;
  /** One-line key specs, shown under the name */
  summary: string;
  /** Lower-cased words to match against: brand, name, category, text specs */
  text: string;
  popularity: number;
}

let searchJob: Promise<SearchEntry[]> | null = null;

/** Small index for the header search, loaded on first focus */
export function fetchSearchIndex(): Promise<SearchEntry[]> {
  searchJob ??= fetch('/data/search.json')
    .then((r) => (r.ok ? (r.json() as Promise<{ items: SearchEntry[] }>) : { items: [] }))
    .then((j) => j.items)
    .catch(() => {
      searchJob = null;
      return [];
    });
  return searchJob;
}

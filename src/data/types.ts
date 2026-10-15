export type CategoryId =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'cooling'
  | 'case';

export type SpecValue = string | number | boolean | string[] | null;
export type Specs = Record<string, SpecValue>;

export interface Product {
  /** URL-safe unique id, also used in routes */
  slug: string;
  category: CategoryId;
  brand: string;
  name: string;
  year: number;
  /** Lower = more popular. Used for default sorting */
  popularity: number;
  specs: Specs;
}

export interface SpecDef {
  key: string;
  label: string;
  /** Shorter label for cards and key stats ("Частота до") */
  short?: string;
  unit?: string;
  /** Fixed number of decimals for numeric values */
  decimals?: number;
  /** Render value in IBM Plex Mono (numbers with units) */
  mono?: boolean;
  /** Which value wins in comparison */
  better?: 'higher' | 'lower';
  /** Derived value (e.g. "8 / 16" for cores / threads) */
  get?: (product: Product) => SpecValue;
  /** Numeric value used to pick the best one in comparison */
  rank?: (product: Product) => number | null;
  /** Custom formatter for booleans / special cases */
  format?: (value: SpecValue) => string;
}

export interface SpecGroup {
  title: string;
  specs: SpecDef[];
}

export interface FilterOption {
  id: string;
  label: string;
  test: (product: Product) => boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

export type IconName =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'cooling'
  | 'case';

export interface CategoryConfig {
  id: CategoryId;
  name: string;
  /** "Процессор", "Видеокарта" — used in compatibility slots */
  singular: string;
  /** Short label for navigation */
  navLabel: string;
  description: string;
  icon: IconName;
  /** Meta line above the model name: "AMD · AM5" */
  meta: (product: Product) => string[];
  /** Three specs shown on the product card */
  cardSpecs: string[];
  /** Four key specs shown in the model hero */
  keySpecs: string[];
  /** Specs for one-line summaries (defaults to cardSpecs) */
  summarySpecs?: string[];
  groups: SpecGroup[];
  filters: FilterGroup[];
  /** Quick filter chips above results: [groupId, optionId] */
  quickFilters: Array<[string, string]>;
}

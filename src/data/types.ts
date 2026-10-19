import type { StoreId } from './stores';

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
  /** Barcodes and manufacturer part numbers: how store offers find this model */
  ids?: { ean?: string[]; mpn?: string[] };
  /** Where the specs come from (set by the data robot) */
  source?: DataSource;
  /** ISO date when the robot last refreshed this model from its source */
  updatedAt?: string;
  /** Product photo URL (Icecat); the category illustration is shown when it's missing */
  image?: string;
}

export type DataSource = 'manual' | 'wikipedia' | 'icecat' | 'store';

/** Store availability of one model */
export interface Offer {
  /** Store name as shown to the user */
  store: string;
  storeId: StoreId;
  /** Price in roubles; null when the store doesn't show it */
  price: number | null;
  inStock: boolean;
  /** Link to the product in the store */
  url: string;
  /** ISO date of the last update */
  updatedAt: string;
}

/** What /data/<category>.json returns: one category with its store offers */
export interface CategoryPayload {
  products: Product[];
  offers: Record<string, Offer[]>;
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

/**
 * A filter of the category page. `enum` facets list the values found in the data
 * (sockets, brands…); `range` facets take a from–to interval of a number.
 */
export interface FacetDef {
  /** Spec key, or 'brand'; also the URL parameter */
  key: string;
  label: string;
  type: 'enum' | 'range';
  unit?: string;
  /** Derived value (yes/no, kit size…); defaults to specs[key] */
  get?: (product: Product) => SpecValue;
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
  /** Short phrase for category cards: what you compare in this category */
  tagline: string;
  icon: IconName;
  /** Meta line above the model name: "AMD · AM5" */
  meta: (product: Product) => string[];
  /** Three specs shown on the product card */
  cardSpecs: string[];
  /** Four key specs shown in the model hero */
  keySpecs: string[];
  /** Specs for one-line summaries (defaults to cardSpecs) */
  summarySpecs?: string[];
  /** Columns of the catalog table (4–6 specs) */
  tableSpecs: string[];
  groups: SpecGroup[];
  facets: FacetDef[];
  /** Quick filter chips above results and in the header menu: [facet key, value] */
  quick: Array<[string, string]>;
}

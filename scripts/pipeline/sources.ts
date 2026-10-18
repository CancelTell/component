/*
  Data sources: store YML feeds (prices, stock, links, some specs) and Open Icecat (specs).
  Credentials come from environment variables (GitHub Secrets), never from code.
*/
import { readFileSync } from 'node:fs';
import { FIXTURES, log, normEan, normMpn, path, readJson, writeJson } from './util';

export type StoreId = 'dns' | 'ozon' | 'citilink' | 'mvideo';

/** FEED_DNS, FEED_OZON, FEED_CITILINK, FEED_MVIDEO: YML feed URLs from the partner network */
export const feedUrls: Record<StoreId, string | undefined> = {
  dns: process.env.FEED_DNS,
  ozon: process.env.FEED_OZON,
  citilink: process.env.FEED_CITILINK,
  mvideo: process.env.FEED_MVIDEO,
};

export interface Param {
  name: string;
  value: string;
  unit?: string;
}

export interface FeedOffer {
  store: StoreId;
  id: string;
  title: string;
  vendor: string;
  mpn: string;
  eans: string[];
  /** Category path as the store names it: "Комплектующие / Процессоры" */
  category: string;
  price: number;
  inStock: boolean;
  url: string;
  params: Param[];
}

/* ---------- YML (Yandex Market format) ---------- */

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1] ?? '') : undefined;
};
const tagsAll = (xml: string, name: string) =>
  [...xml.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => decode(m[1] ?? ''));
const attr = (attrs: string, name: string) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];

export function parseYml(xml: string, store: StoreId): FeedOffer[] {
  // Category tree → full path, so "Процессоры" under "Комплектующие" is easy to recognise
  const cats = new Map<string, { name: string; parent?: string }>();
  for (const m of xml.matchAll(/<category\s([^>]*)>([\s\S]*?)<\/category>/g)) {
    const id = attr(m[1] ?? '', 'id');
    if (id) cats.set(id, { name: decode(m[2] ?? ''), parent: attr(m[1] ?? '', 'parentId') });
  }
  const catPath = (id: string | undefined): string => {
    const parts: string[] = [];
    let cur = id;
    for (let guard = 0; cur && guard < 10; guard++) {
      const c = cats.get(cur);
      if (!c) break;
      parts.unshift(c.name);
      cur = c.parent;
    }
    return parts.join(' / ');
  };

  const out: FeedOffer[] = [];
  for (const m of xml.matchAll(/<offer\b([^>]*)>([\s\S]*?)<\/offer>/g)) {
    const attrs = m[1] ?? '';
    const body = m[2] ?? '';
    const price = Number((tag(body, 'price') ?? '').replace(/\s/g, '').replace(',', '.'));
    const url = tag(body, 'url');
    const vendor = tag(body, 'vendor') ?? '';
    const model = tag(body, 'model');
    const title = tag(body, 'name') ?? [tag(body, 'typePrefix'), vendor, model].filter(Boolean).join(' ');
    if (!price || !url || !title) continue;
    const params: Param[] = [];
    for (const p of body.matchAll(/<param\s([^>]*)>([\s\S]*?)<\/param>/g)) {
      const name = attr(p[1] ?? '', 'name');
      if (name) params.push({ name: decode(name), unit: attr(p[1] ?? '', 'unit'), value: decode(p[2] ?? '') });
    }
    out.push({
      store,
      id: attr(attrs, 'id') ?? url,
      title,
      vendor,
      mpn: normMpn(tag(body, 'vendorCode')),
      eans: tagsAll(body, 'barcode').map(normEan).filter(Boolean),
      category: catPath(tag(body, 'categoryId')),
      price: Math.round(price),
      inStock: attr(attrs, 'available') !== 'false',
      url,
      params,
    });
  }
  return out;
}

export async function loadFeeds(): Promise<FeedOffer[]> {
  const all: FeedOffer[] = [];
  for (const store of Object.keys(feedUrls) as StoreId[]) {
    let xml: string | null = null;
    if (FIXTURES) {
      try {
        xml = readFileSync(path(`scripts/pipeline/fixtures/${store}.xml`), 'utf8');
      } catch {
        xml = null;
      }
    } else if (feedUrls[store]) {
      try {
        const res = await fetch(feedUrls[store]!, { headers: { 'user-agent': 'component-catalog/1.0' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        xml = await res.text();
      } catch (e) {
        log(`${store}: фид недоступен (${(e as Error).message}), пропускаю`);
      }
    }
    if (!xml) continue;
    const offers = parseYml(xml, store);
    log(`${store}: ${offers.length} предложений в фиде`);
    all.push(...offers);
  }
  return all;
}

/* ---------- Open Icecat (live JSON API) ---------- */

export interface IcecatSheet {
  brand: string;
  name: string;
  title: string;
  mpn: string;
  eans: string[];
  category: string;
  year: number | null;
  features: Param[];
}

/** ICECAT_USERNAME (required for Icecat), ICECAT_API_TOKEN (optional) */
const ICECAT_USER = process.env.ICECAT_USERNAME;
const ICECAT_TOKEN = process.env.ICECAT_API_TOKEN;
export const icecatEnabled = () => FIXTURES || !!ICECAT_USER;

const CACHE_FILE = '.cache/icecat.json';
const cache = readJson<Record<string, IcecatSheet | null>>(CACHE_FILE, {});
export const saveIcecatCache = () => writeJson(CACHE_FILE, cache);

interface IcecatFeature {
  Feature?: { Name?: { Value?: string }; Measure?: { Signs?: { _?: string } } };
  PresentationValue?: string;
  Value?: string;
}
interface IcecatResponse {
  msg?: string;
  StatusCode?: number;
  data?: {
    GeneralInfo?: {
      Brand?: string;
      ProductName?: string;
      Title?: string;
      BrandPartCode?: string;
      GTIN?: string[];
      Category?: { Name?: { Value?: string } };
      ReleaseDate?: string;
    };
    FeaturesGroups?: Array<{ Features?: IcecatFeature[] }>;
  };
}

export function parseIcecat(json: IcecatResponse): IcecatSheet | null {
  const g = json.data?.GeneralInfo;
  if (!g) return null;
  const features: Param[] = [];
  for (const group of json.data?.FeaturesGroups ?? []) {
    for (const f of group.Features ?? []) {
      const name = f.Feature?.Name?.Value;
      const value = f.PresentationValue ?? f.Value;
      if (name && value) features.push({ name, value });
    }
  }
  const year = Number(g.ReleaseDate?.slice(-4));
  return {
    brand: g.Brand ?? '',
    name: g.ProductName ?? '',
    title: g.Title ?? '',
    mpn: normMpn(g.BrandPartCode),
    eans: (g.GTIN ?? []).map(normEan).filter(Boolean),
    category: g.Category?.Name?.Value ?? '',
    year: year > 1990 ? year : null,
    features,
  };
}

let requests = 0;
/** Looks a product up by EAN, then by brand + part number. Results (including misses) are cached. */
export async function icecatLookup(q: { ean?: string; brand?: string; mpn?: string }): Promise<IcecatSheet | null> {
  const key = q.ean ? `ean:${q.ean}` : `mpn:${q.brand}:${q.mpn}`;
  if (key in cache) return cache[key] ?? null;
  if (!icecatEnabled() || (!q.ean && !(q.brand && q.mpn))) return null;

  let sheet: IcecatSheet | null = null;
  if (FIXTURES) {
    const file = `scripts/pipeline/fixtures/icecat/${q.ean || q.mpn}.json`;
    sheet = parseIcecat(readJson<IcecatResponse>(file, {}));
  } else {
    const url = new URL('https://live.icecat.biz/api');
    url.searchParams.set('lang', 'EN');
    url.searchParams.set('shopname', ICECAT_USER!);
    if (q.ean) url.searchParams.set('GTIN', q.ean);
    else {
      url.searchParams.set('Brand', q.brand!);
      url.searchParams.set('ProductCode', q.mpn!);
    }
    try {
      requests++;
      if (requests % 20 === 0) await new Promise((r) => setTimeout(r, 1000)); // be polite
      const res = await fetch(url, { headers: ICECAT_TOKEN ? { 'api-token': ICECAT_TOKEN } : {} });
      const json = (await res.json()) as IcecatResponse;
      sheet = res.ok ? parseIcecat(json) : null;
    } catch (e) {
      log(`Icecat: ошибка запроса (${(e as Error).message})`);
      return null; // not cached: try again next run
    }
  }
  cache[key] = sheet;
  return sheet;
}

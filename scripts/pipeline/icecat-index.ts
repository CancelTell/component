/*
  Open Icecat bulk listing: which products exist in the categories we need.
  1) CategoriesList.xml.gz → category ids by English name (or ids from data/import-config.json)
  2) on_market / files index (CSV, gzip) → product ids in those categories, newest first
  The data sheets themselves are then fetched one by one through the live JSON API (sources.ts),
  a limited number per run, so the catalog grows a little every night.
  Needs ICECAT_USERNAME + ICECAT_PASSWORD (Open Icecat account) for the bulk files.
*/
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import type { CategoryId } from '../../src/data/types';
import { FIXTURES, log, path } from './util';

export interface IcecatImportConfig {
  /** Explicit category ids override the name search */
  categories?: Partial<Record<CategoryId, number[]>>;
  /** Data sheets to fetch per category per run */
  perCategory?: number;
  /** Only these brands (case-insensitive substring of the supplier name); empty = all */
  brands?: string[];
}

export interface IndexItem {
  id: string;
  category: CategoryId;
  brand: string;
  mpn: string;
  model: string;
  added: string;
}

const NAME_RULES: Array<[CategoryId, RegExp]> = [
  ['motherboard', /^motherboards?$/i],
  ['ram', /^memory modules?$/i],
  ['storage', /^(internal )?solid state drives?( \(ssd\))?$/i],
  ['psu', /^power supply units?$/i],
  ['cooling', /^(computer cooling (systems|components)|processor coolers?|cpu coolers?)$/i],
  ['case', /^computer cases?$/i],
];

const USER = process.env.ICECAT_USERNAME;
const PASSWORD = process.env.ICECAT_PASSWORD;
export const icecatBulkEnabled = () => FIXTURES || !!(USER && PASSWORD);

async function* readLines(url: string, fixture: string): AsyncGenerator<string> {
  let input: NodeJS.ReadableStream;
  if (FIXTURES) input = createReadStream(path(`scripts/pipeline/fixtures/icecat/${fixture}`));
  else {
    const res = await fetch(url, { headers: { authorization: `Basic ${Buffer.from(`${USER}:${PASSWORD}`).toString('base64')}` } });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} ${url}`);
    input = Readable.fromWeb(res.body as import('node:stream/web').ReadableStream).pipe(createGunzip());
  }
  for await (const line of createInterface({ input, crlfDelay: Infinity })) yield line;
}

/** Category ids by English name; also reports near matches so the rules can be tuned */
async function findCategories(config: IcecatImportConfig, notes: string[]): Promise<Map<number, CategoryId>> {
  const map = new Map<number, CategoryId>();
  for (const [cat, ids] of Object.entries(config.categories ?? {}) as Array<[CategoryId, number[]]>) ids.forEach((id) => map.set(id, cat));
  const fixed = new Set(map.values());
  if (fixed.size === NAME_RULES.length) return map;

  const near: string[] = [];
  let current: number | null = null;
  let inParent = 0;
  for await (const line of readLines('https://data.icecat.biz/export/freexml/refs/CategoriesList.xml.gz', 'CategoriesList.xml')) {
    for (const tag of line.matchAll(/<(\/?)(Category|ParentCategory|Name)\b([^>]*)>/g)) {
      const [, close, name, attrs = ''] = tag;
      if (name === 'ParentCategory') inParent += close ? -1 : attrs.trim().endsWith('/') ? 0 : 1;
      else if (name === 'Category' && !close) current = Number(attrs.match(/\bID="(\d+)"/)?.[1] ?? NaN);
      else if (name === 'Category' && close) current = null;
      else if (name === 'Name' && !inParent && current !== null && /langid="1"/.test(attrs)) {
        const value = attrs.match(/Value="([^"]*)"/)?.[1] ?? '';
        const rule = NAME_RULES.find(([cat, re]) => !fixed.has(cat) && re.test(value));
        if (rule) map.set(current, rule[0]);
        else if (/motherboard|memory module|solid state|power supply|cooler|cooling|computer case/i.test(value) && near.length < 30) near.push(`${current}: ${value}`);
      }
    }
  }
  notes.push('Категории Icecat:', ...[...map.entries()].map(([id, cat]) => `- ${cat} ← ${id}`));
  if (near.length) notes.push('Похожие категории (не выбраны):', ...near.map((x) => `- ${x}`));
  return map;
}

export async function loadIcecatIndex(config: IcecatImportConfig, notes: string[]): Promise<IndexItem[]> {
  if (!icecatBulkEnabled()) {
    notes.push('Icecat: список товаров не загружен — нужен секрет ICECAT_PASSWORD (вместе с ICECAT_USERNAME).');
    return [];
  }
  let categories: Map<number, CategoryId>;
  try {
    categories = await findCategories(config, notes);
  } catch (e) {
    notes.push(`Icecat: не удалось получить список категорий (${(e as Error).message})`);
    return [];
  }
  if (!categories.size) return [];

  const brands = (config.brands ?? []).map((b) => b.toLowerCase());
  const items: IndexItem[] = [];
  const urls = [
    ['https://data.icecat.biz/export/freexml/EN/on_market.index.csv.gz', 'on_market.index.csv'],
    ['https://data.icecat.biz/export/freexml/EN/files.index.csv.gz', 'files.index.csv'],
  ] as const;

  for (const [url, fixture] of urls) {
    try {
      let cols: string[] | null = null;
      let sep = '\t';
      let scanned = 0;
      for await (const line of readLines(url, fixture)) {
        if (!cols) {
          sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
          cols = line.split(sep).map((c) => c.trim().toLowerCase());
          continue;
        }
        scanned++;
        const f = line.split(sep);
        const get = (name: string) => f[cols!.indexOf(name)]?.trim() ?? '';
        const category = categories.get(Number(get('catid')));
        if (!category) continue;
        if (get('on_market') === '0' || /removed/i.test(get('quality'))) continue;
        const brand = get('m_supplier_name') || get('supplier_name') || get('supplier');
        if (brands.length && !brands.some((b) => brand.toLowerCase().includes(b))) continue;
        items.push({ id: get('product_id'), category, brand, mpn: get('prod_id'), model: get('model_name'), added: get('date_added') || get('updated') });
      }
      notes.push(`Icecat: индекс ${url.split('/').pop()} — строк ${scanned}, подходящих товаров ${items.length}`);
      break;
    } catch (e) {
      notes.push(`Icecat: ${url.split('/').pop()} недоступен (${(e as Error).message})`);
    }
  }
  // Newest first: the most likely to be on sale now
  items.sort((a, b) => b.added.localeCompare(a.added));
  log(`Icecat: в индексе ${items.length} подходящих товаров`);
  return items;
}

/*
  Desktop CPUs and GPUs from Wikipedia list pages (CC BY-SA; attribution in the site footer).
  Only current desktop platforms are taken; the socket and memory type come from the model
  number itself, which is more reliable than table layouts that change between pages.
*/
import { readFileSync } from 'node:fs';
import type { Product, Specs } from '../../src/data/types';
import { findCol, parseTables, type Table } from './html-table';
import { FIXTURES, log, path, slugify } from './util';

export interface WikiConfig {
  cpuPages: string[];
  gpuPages: string[];
}

export interface WikiResult {
  products: Product[];
  /** Human-readable notes for data/sources-report.md */
  notes: string[];
}

async function fetchPage(title: string): Promise<string | null> {
  if (FIXTURES) {
    try {
      return readFileSync(path(`scripts/pipeline/fixtures/wiki/${title}.html`), 'utf8');
    } catch {
      return null;
    }
  }
  const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&prop=text&redirects=1&page=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'component-catalog/1.0 (PC parts catalog; contact via GitHub)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { parse?: { text?: string }; error?: { info?: string } };
    if (!json.parse?.text) throw new Error(json.error?.info ?? 'empty page');
    return json.parse.text;
  } catch (e) {
    log(`Википедия: ${title} не загрузилась (${(e as Error).message})`);
    return null;
  }
}

const n = (s: string | undefined): number | null => {
  const m = (s ?? '').replace(/,(?=\d{3}\b)/g, '').match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const yearOf = (s: string | undefined) => {
  const m = (s ?? '').match(/\b(20[1-3]\d)\b/);
  return m ? Number(m[1]) : 0;
};
const isMobileContext = (t: Table) => /mobile|laptop|notebook|embedded|server|workstation|max-q|handheld/i.test(`${t.context.join(' ')} ${t.caption}`);

/* ---------- CPU ---------- */

interface CpuId {
  brand: 'AMD' | 'Intel';
  name: string;
  socket: string;
  memory: string[];
}

/** Recognises desktop models and derives the platform from the model number */
export function cpuIdentity(raw: string): CpuId | null {
  const t = raw.replace(/\s+/g, ' ').replace(/™|®/g, '');
  const amd = t.match(/\bRyzen\s+([3579])\s+(\d{4})(X3D|XT|X|GT|G|F|E)?\b(?!\s*(HX|HS|H|U|M)\b)/i);
  if (amd) {
    const series = Number(amd[2]![0]);
    const suffix = (amd[3] ?? '').toUpperCase();
    const name = `Ryzen ${amd[1]} ${amd[2]}${suffix}`;
    // Desktop: 9000, 8000G/F, 7000 → AM5; 5000, 4000, 3000 → AM4
    if (series >= 7 || (series === 8 && /G|F/.test(suffix))) return { brand: 'AMD', name, socket: 'AM5', memory: ['DDR5'] };
    if (series >= 3 && series <= 5) return { brand: 'AMD', name, socket: 'AM4', memory: ['DDR4'] };
    return null;
  }
  const core = t.match(/\bCore\s+i([3579])[-\s]?(1[234]\d{3})(KS|KF|K|F|T)?\b(?!\s*(HX|H|U|P)\b)/i);
  if (core) return { brand: 'Intel', name: `Core i${core[1]}-${core[2]}${(core[3] ?? '').toUpperCase()}`, socket: 'LGA1700', memory: ['DDR4', 'DDR5'] };
  const ultra = t.match(/\bCore\s+Ultra\s+([579])\s+(2[0-9]5)(KF|K|F|T)?\b(?!\s*(HX|H|U|V)\b)/i);
  if (ultra) return { brand: 'Intel', name: `Core Ultra ${ultra[1]} ${ultra[2]}${(ultra[3] ?? '').toUpperCase()}`, socket: 'LGA1851', memory: ['DDR5'] };
  return null;
}

function cpusFrom(table: Table, notes: Map<string, number>): Product[] {
  if (isMobileContext(table)) return [];
  const h = table.headers;
  // Column search with exclusions: "Base power" is TDP, "Graphics max frequency" is the iGPU
  const pick = (want: RegExp, not?: RegExp) => h.findIndex((x) => want.test(x) && !(not && not.test(x)));
  const col = {
    model: Math.max(0, pick(/model|branding|processor|name/i)),
    cores: pick(/cores?/i),
    threads: pick(/threads/i, /cores?/i),
    base: pick(/base|clock|frequency|ghz/i, /power|tdp|graphics|gpu|memory|bus/i),
    boost: pick(/boost|turbo|max/i, /power|tdp|graphics|gpu|memory|temp/i),
    l3: pick(/l3/i) >= 0 ? pick(/l3/i) : pick(/cache/i, /l2|l1/i),
    tdp: pick(/tdp|base power|pbp|default power/i) >= 0 ? pick(/tdp|base power|pbp|default power/i) : pick(/power/i, /graphics|gpu|max|turbo|processing/i),
    release: pick(/release|launch|date/i),
  };
  const out: Product[] = [];
  for (const row of table.rows) {
    const id = cpuIdentity(row[col.model] ?? '') ?? cpuIdentity(row.join(' '));
    if (!id) continue;
    const coresCell = row[col.cores] ?? '';
    // "8 (16)" or "8 / 16" or "6P + 8E (20)"
    const pe = coresCell.match(/(\d+)\s*P\s*\+\s*(\d+)\s*E/i);
    const cores = pe ? Number(pe[1]) + Number(pe[2]) : n(coresCell);
    const threadsInCell = coresCell.match(/\((\d+)\)|\/\s*(\d+)/);
    const threads = col.threads >= 0 ? n(row[col.threads]) : threadsInCell ? Number(threadsInCell[1] ?? threadsInCell[2]) : null;
    const ghz = (s: string | undefined) => {
      const v = n(s);
      return v === null ? null : v > 100 ? Math.round(v / 10) / 100 : v;
    };
    // Base/boost are sometimes one cell "4.2 / 5.0"
    let base = ghz(row[col.base]);
    let boost = col.boost >= 0 && col.boost !== col.base ? ghz(row[col.boost]) : null;
    const pair = (row[col.base] ?? '').match(/(\d+(?:\.\d+)?)\s*[/–-]\s*(\d+(?:\.\d+)?)/);
    if (pair && boost === null) {
      base = Number(pair[1]);
      boost = Number(pair[2]);
    }
    const specs: Specs = {
      socket: id.socket,
      memory: id.memory,
      channels: 2,
      // All Ryzen are unlocked; Intel only with K
      unlocked: id.brand === 'AMD' ? true : /K/.test(id.name.split(/[-\s]/).pop() ?? ''),
    };
    if (cores) specs.cores = cores;
    if (threads) specs.threads = threads;
    if (base) specs.baseClock = base;
    if (boost) specs.boostClock = boost;
    const l3 = n(row[col.l3]);
    if (l3) specs.l3 = l3;
    const tdp = n(row[col.tdp]);
    if (tdp) specs.tdp = tdp;
    out.push({ slug: slugify(`${id.brand} ${id.name}`), category: 'cpu', brand: id.brand, name: id.name, year: yearOf(row[col.release]), popularity: 1000, specs });
  }
  if (out.length) notes.set(`CPU: ${table.context.slice(-2).join(' › ')} — колонки: ${h.filter(Boolean).slice(0, 10).join(' | ')}`, out.length);
  return out;
}

/* ---------- GPU ---------- */

export function gpuIdentity(raw: string): { brand: string; name: string } | null {
  const t = raw.replace(/\s+/g, ' ').replace(/™|®/g, '');
  if (/laptop|mobile|max-q|\bM\b/i.test(t)) return null;
  const nv = t.match(/\bRTX\s?([2-5]0[5-9]0)(\s?Ti)?(\s?SUPER)?\b/i);
  if (nv) return { brand: 'NVIDIA', name: `GeForce RTX ${nv[1]}${nv[2] ? ' Ti' : ''}${nv[3] ? ' SUPER' : ''}` };
  const amd = t.match(/\bRX\s?([679]\d{3})(\s?XTX|\s?XT|\s?GRE)?\b/i);
  if (amd) return { brand: 'AMD', name: `Radeon RX ${amd[1]}${amd[2] ? ` ${amd[2].trim().toUpperCase()}` : ''}` };
  const arc = t.match(/\bArc\s?([AB][3-9]\d0)\b/i);
  if (arc) return { brand: 'Intel', name: `Arc ${arc[1]!.toUpperCase()}` };
  return null;
}

function gpusFrom(table: Table, notes: Map<string, number>): Product[] {
  if (isMobileContext(table)) return [];
  const h = table.headers;
  const strict = findCol(h, /tdp|tbp|tgp|board power/i);
  const col = {
    model: Math.max(0, findCol(h, /model|name|card/i)),
    size: findCol(h, /memory/i, /size|gb|gib|capacity/i),
    type: findCol(h, /memory/i, /type/i),
    bus: findCol(h, /bus/i, /width|bit/i),
    // "Processing power (GFLOPS)" is not watts
    tdp: strict >= 0 ? strict : h.findIndex((x) => /power/i.test(x) && !/processing|gflops|tflops/i.test(x)),
    release: findCol(h, /release|launch/i),
  };
  const out: Product[] = [];
  for (const row of table.rows) {
    const id = gpuIdentity(row[col.model] ?? '');
    if (!id) continue;
    const specs: Specs = {};
    const size = n(row[col.size]);
    if (size && size <= 48) specs.vram = size;
    const type = (row[col.type] ?? '').toUpperCase().match(/GDDR\dX?|HBM\d?/)?.[0];
    if (type) specs.memType = type;
    const bus = n(row[col.bus]);
    if (bus && bus >= 64) specs.bus = bus;
    const tdp = n(row[col.tdp]);
    if (tdp && tdp >= 30 && tdp <= 700) {
      specs.tdp = tdp;
      specs.recPsu = Math.max(450, Math.ceil(((tdp + 250) * 1.2) / 50) * 50);
    }
    // Card length depends on the partner version: unknown here, the checks say so
    out.push({ slug: slugify(`${id.brand} ${id.name}`), category: 'gpu', brand: id.brand, name: id.name, year: yearOf(row[col.release]), popularity: 1000, specs });
  }
  if (out.length) notes.set(`GPU: ${table.context.slice(-2).join(' › ')} — колонки: ${h.filter(Boolean).slice(0, 10).join(' | ')}`, out.length);
  return out;
}

/** First complete row wins for each model; later rows only fill gaps */
function mergeBySlug(list: Product[]): Product[] {
  const map = new Map<string, Product>();
  for (const p of list) {
    const cur = map.get(p.slug);
    if (!cur) map.set(p.slug, p);
    else {
      for (const [k, v] of Object.entries(p.specs)) if (cur.specs[k] === undefined || cur.specs[k] === null) cur.specs[k] = v;
      if (!cur.year && p.year) cur.year = p.year;
    }
  }
  return [...map.values()];
}

export async function loadWikipedia(config: WikiConfig): Promise<WikiResult> {
  const notes = new Map<string, number>();
  const found: Product[] = [];
  const summary: string[] = [];
  for (const [kind, pages] of [['cpu', config.cpuPages], ['gpu', config.gpuPages]] as const) {
    for (const page of pages) {
      const html = await fetchPage(page);
      if (!html) {
        summary.push(`- ${page}: не загрузилась`);
        continue;
      }
      const tables = parseTables(html);
      const before = found.length;
      for (const t of tables) found.push(...(kind === 'cpu' ? cpusFrom(t, notes) : gpusFrom(t, notes)));
      summary.push(`- ${page}: таблиц ${tables.length}, моделей ${found.length - before}`);
    }
  }
  const products = mergeBySlug(found);
  log(`Википедия: ${products.length} моделей (${products.filter((p) => p.category === 'cpu').length} процессоров, ${products.filter((p) => p.category === 'gpu').length} видеокарт)`);
  return {
    products,
    notes: [...summary, '', 'Таблицы, из которых взяты модели:', ...[...notes.entries()].map(([k, v]) => `- ${v} × ${k}`)],
  };
}


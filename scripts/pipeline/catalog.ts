/*
  Catalog update: store feeds tell WHICH models are on sale, Icecat and feed parameters tell
  WHAT their specs are. New models are added only when every field the compatibility checks
  need is known; the rest go to the report.

  npm run data:catalog            real sources (needs env vars, see README)
  npm run data:catalog -- --fixtures   test data from scripts/pipeline/fixtures
*/
import { cpus } from '../../src/data/products/cpu';
import { gpus } from '../../src/data/products/gpu';
import { motherboards } from '../../src/data/products/motherboard';
import { cases, coolers, psus, rams, storages } from '../../src/data/products/other';
import type { CategoryId, Product, Specs } from '../../src/data/types';
import { buildIndex, matchOffer, offerKey } from './match';
import { canonicalName, categoryOf, cleanName, extractSpecs, gpuChip, missingFields } from './normalize';
import { type IcecatImportConfig, loadIcecatIndex } from './icecat-index';
import { type FeedOffer, type IcecatSheet, icecatCached, icecatEnabled, icecatLookup, loadFeeds, saveIcecatCache } from './sources';
import { OUT, log, normMpn, readJson, slugify, today, writeJson, writeText } from './util';
import { type WikiConfig, loadWikipedia } from './wikipedia';

interface ImportConfig {
  wikipedia: WikiConfig;
  icecat: IcecatImportConfig;
}
const DEFAULT_CONFIG: ImportConfig = {
  wikipedia: { cpuPages: ['List_of_AMD_Ryzen_processors', 'List_of_Intel_Core_processors'], gpuPages: ['List_of_Nvidia_graphics_processing_units', 'List_of_AMD_graphics_processing_units'] },
  icecat: { perCategory: 40, brands: [] },
};

/** "Kingston Technology" → "Kingston", "ASUSTeK Computer" → "ASUS" */
function cleanBrand(brand: string): string {
  const b = brand.trim();
  if (/^asus/i.test(b)) return 'ASUS';
  if (/^(msi|micro-star)/i.test(b)) return 'MSI';
  if (/^gigabyte/i.test(b)) return 'GIGABYTE';
  if (/^western digital/i.test(b)) return 'WD';
  return b.replace(/\s+(technology|technologies|components|inc\.?|corporation|corp\.?|co\.?,? ?ltd\.?|gmbh|international|computer)$/i, '').trim();
}

/** Product from an Icecat data sheet; the name falls back to the title when ProductName is just a series */
function fromSheet(sheet: IcecatSheet, category: CategoryId, unknown: Map<string, number>): Product {
  const brand = cleanBrand(sheet.brand);
  const strip = (t: string) => cleanName(t.replace(sheet.brand, ' '), brand);
  const specs = extractSpecs(category, sheet.features, unknown);
  let name = strip(sheet.name);
  // ProductName is sometimes just a series ("FURY Beast"); memory and SSD names get their size anyway
  if (!/\d/.test(name) && sheet.title && category !== 'ram' && category !== 'storage') name = strip(sheet.title);
  name = canonicalName(category, name, specs);
  return {
    slug: slugify(`${brand} ${name}`),
    category,
    brand,
    name,
    year: sheet.year ?? 0,
    popularity: 1000,
    specs,
    ids: { ...(sheet.eans.length ? { ean: sheet.eans } : {}), ...(sheet.mpn ? { mpn: [sheet.mpn] } : {}) },
  };
}

export interface CatalogFile {
  generatedAt: string;
  products: Product[];
}

export interface Overrides {
  /** Per model: fix a name or specs, add identifiers, or hide it */
  products?: Record<string, { name?: string; brand?: string; specs?: Specs; ids?: Product['ids']; hide?: boolean }>;
}

const seeds: Product[] = [...cpus, ...gpus, ...motherboards, ...rams, ...storages, ...psus, ...coolers, ...cases];

function addIds(p: Product, offers: FeedOffer[]) {
  const ean = new Set(p.ids?.ean ?? []);
  const mpn = new Set(p.ids?.mpn ?? []);
  for (const o of offers) {
    if (p.category === 'gpu') continue; // a chip has many cards: don't pin it to one card's codes
    o.eans.forEach((e) => ean.add(e));
    if (o.mpn) mpn.add(o.mpn);
  }
  p.ids = { ...(ean.size ? { ean: [...ean].sort() } : {}), ...(mpn.size ? { mpn: [...mpn].sort() } : {}) };
  if (!p.ids.ean && !p.ids.mpn) delete p.ids;
}

async function main() {
  const overrides = readJson<Overrides>('data/overrides.json', {});
  const previous = readJson<CatalogFile>(`${OUT}/catalog.json`, { generatedAt: '', products: [] });

  // Base: hand-made seed models + everything imported earlier
  const bySlug = new Map<string, Product>();
  for (const p of previous.products) bySlug.set(p.slug, structuredClone(p));
  for (const p of seeds) bySlug.set(p.slug, { ...structuredClone(p), ids: bySlug.get(p.slug)?.ids ?? p.ids });
  for (const [slug, o] of Object.entries(overrides.products ?? {})) {
    const p = bySlug.get(slug);
    if (p && o.ids) p.ids = { ean: [...new Set([...(p.ids?.ean ?? []), ...(o.ids.ean ?? [])])], mpn: [...new Set([...(p.ids?.mpn ?? []), ...(o.ids.mpn ?? [])])] };
  }

  const config: ImportConfig = { ...DEFAULT_CONFIG, ...readJson<Partial<ImportConfig>>('data/import-config.json', {}) };
  const unknown = new Map<string, number>();
  const quarantine: Array<{ title: string; category: CategoryId; missing: string[]; stores: string[] }> = [];
  const sourceNotes: string[] = [];
  let added = 0;

  /* 1. Wikipedia: desktop CPUs and GPUs (chips) */
  const wiki = await loadWikipedia(config.wikipedia);
  sourceNotes.push('## Википедия', '', ...wiki.notes, '');
  let fromWiki = 0;
  for (const p of wiki.products) {
    const cur = bySlug.get(p.slug);
    if (cur) {
      // Known model: only fill fields it doesn't have yet
      for (const [k, v] of Object.entries(p.specs)) if (cur.specs[k] === undefined || cur.specs[k] === null) cur.specs[k] = v;
      if (!cur.year && p.year) cur.year = p.year;
      continue;
    }
    const missing = missingFields(p.category, p.specs);
    if (missing.length) quarantine.push({ title: `${p.brand} ${p.name}`, category: p.category, missing, stores: ['Википедия'] });
    else {
      bySlug.set(p.slug, p);
      fromWiki++;
    }
  }
  added += fromWiki;

  /* 2. Icecat: boards, memory, SSD, PSU, coolers, cases — a limited number of new sheets per run */
  const indexItems = await loadIcecatIndex(config.icecat, sourceNotes);
  const knownMpn = new Set([...bySlug.values()].flatMap((p) => p.ids?.mpn ?? []));
  const fetched: Partial<Record<CategoryId, number>> = {};
  const limit = config.icecat.perCategory ?? 40;
  let fromIcecat = 0;
  for (const item of indexItems) {
    if (knownMpn.has(normMpn(item.mpn))) continue;
    const cached = icecatCached(item.id);
    if (!cached && (fetched[item.category] ?? 0) >= limit) continue;
    if (!cached) fetched[item.category] = (fetched[item.category] ?? 0) + 1;
    const sheet = await icecatLookup({ id: item.id });
    if (!sheet) continue;
    // Laptop memory is not for desktop builds
    if (item.category === 'ram' && sheet.features.some((f) => /so-?dimm/i.test(f.value))) continue;
    const p = fromSheet(sheet, item.category, unknown);
    if (bySlug.has(p.slug)) continue;
    const missing = missingFields(p.category, p.specs);
    if (missing.length || !p.name) {
      quarantine.push({ title: `${p.brand} ${p.name}`, category: p.category, missing, stores: ['Icecat'] });
      continue;
    }
    bySlug.set(p.slug, p);
    p.ids?.mpn?.forEach((m) => knownMpn.add(m));
    fromIcecat++;
  }
  added += fromIcecat;
  sourceNotes.push('', `Icecat: запрошено новых карточек ${Object.values(fetched).reduce((a, b) => a + (b ?? 0), 0)}, добавлено моделей ${fromIcecat}`);
  log(`Википедия: +${fromWiki}, Icecat: +${fromIcecat}`);

  /* 3. Store feeds: which models are on sale (and their specs when nothing else has them) */
  const feeds = await loadFeeds();
  const relevant = feeds.filter((o) => categoryOf(o.category));
  log(`в нужных категориях: ${relevant.length} предложений`);

  // Group offers of one model across stores
  const groups = new Map<string, FeedOffer[]>();
  for (const o of relevant) {
    const key = offerKey(o);
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }

  let matched = 0;
  const storesPerSlug = new Map<string, number>();

  let index = buildIndex([...bySlug.values()]);
  for (const offers of groups.values()) {
    const first = offers[0]!;
    const category = categoryOf(first.category)!;
    const existing = offers.map((o) => matchOffer(o, index)).find(Boolean) ?? null;
    const stores = [...new Set(offers.map((o) => o.store))];

    if (existing) {
      matched++;
      addIds(existing, offers);
      storesPerSlug.set(existing.slug, stores.length);
      continue;
    }

    // New model: specs from Icecat first, then from the richest store feed
    const richest = [...offers].sort((a, b) => b.params.length - a.params.length)[0]!;
    const ean = offers.flatMap((o) => o.eans)[0];
    const sheet = icecatEnabled() ? await icecatLookup(ean ? { ean } : { brand: first.vendor, mpn: first.mpn }) : null;
    const specs = extractSpecs(category, [...(sheet?.features ?? []), ...richest.params], unknown);

    const chip = category === 'gpu' ? gpuChip(first.title) : null;
    const brand = chip?.brand ?? (sheet?.brand || first.vendor || first.title.split(' ')[0] || '');
    const name = chip?.name ?? canonicalName(category, cleanName(sheet?.name || first.title, brand), specs);
    const slug = slugify(`${brand} ${name}`);
    const missing = missingFields(category, specs);

    if (missing.length || !name) {
      quarantine.push({ title: first.title, category, missing, stores });
      continue;
    }
    const product: Product = {
      slug,
      category,
      brand,
      name,
      // 0 = unknown; the site shows a dash
      year: sheet?.year ?? 0,
      popularity: 1000,
      specs,
    };
    addIds(product, offers);
    bySlug.set(slug, product);
    index = buildIndex([...bySlug.values()]);
    storesPerSlug.set(slug, stores.length);
    added++;
  }

  // Popularity of imported models: offered by more stores → higher; seeds keep their order
  const seedSlugs = new Set(seeds.map((s) => s.slug));
  const imported = [...bySlug.values()].filter((p) => !seedSlugs.has(p.slug));
  imported
    .sort((a, b) => (storesPerSlug.get(b.slug) ?? 0) - (storesPerSlug.get(a.slug) ?? 0) || a.name.localeCompare(b.name))
    .forEach((p, i) => (p.popularity = 100 + i));

  // Manual fixes always win
  for (const [slug, o] of Object.entries(overrides.products ?? {})) {
    const p = bySlug.get(slug);
    if (!p) continue;
    if (o.hide) {
      bySlug.delete(slug);
      continue;
    }
    if (o.name) p.name = o.name;
    if (o.brand) p.brand = o.brand;
    if (o.specs) p.specs = { ...p.specs, ...o.specs };
  }

  const order: CategoryId[] = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'cooling', 'case'];
  const products = [...bySlug.values()].sort(
    (a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.popularity - b.popularity || a.slug.localeCompare(b.slug),
  );
  writeJson(`${OUT}/catalog.json`, { generatedAt: today(), products } satisfies CatalogFile);
  saveIcecatCache();

  const top = [...unknown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  writeText(
    `${OUT}/report.md`,
    [
      `# Отчёт каталога, ${today()}`,
      '',
      `- Моделей в каталоге: **${products.length}**`,
      `- Новых за этот запуск: **${added}**`,
      `- Предложений магазинов, привязанных к известным моделям: ${matched} групп`,
      `- Не добавлены, не хватает данных: **${quarantine.length}**`,
      `- Icecat: ${icecatEnabled() ? 'подключён' : 'не подключён (нет ICECAT_USERNAME)'}`,
      '',
      'По моделям по категориям: ' + (['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'cooling', 'case'] as CategoryId[]).map((c) => `${c} ${products.filter((p) => p.category === c).length}`).join(', '),
      '',
      'Подробности по Википедии и Icecat — в `data/sources-report.md`.',
      '',
      '## Не добавлены: не хватает полей для проверки совместимости',
      '',
      'Допишите поля в `data/overrides.json` или дождитесь, пока источник их заполнит.',
      '',
      ...(quarantine.length
        ? ['| Категория | Модель | Не хватает | Источник |', '|---|---|---|---|', ...quarantine.slice(0, 80).map((q) => `| ${q.category} | ${q.title} | ${q.missing.join(', ')} | ${q.stores.join(', ')} |`), ...(quarantine.length > 80 ? [`\nи ещё ${quarantine.length - 80}`] : [])]
        : ['Всё в порядке.']),
      '',
      '## Нераспознанные характеристики',
      '',
      'Часто встречающиеся параметры, для которых нет правила в `scripts/pipeline/normalize.ts`.',
      '',
      ...(top.length ? top.map(([k, n]) => `- ${k} (${n})`) : ['Нет.']),
      '',
    ].join('\n'),
  );
  writeText(`${OUT}/sources-report.md`, [`# Источники, ${today()}`, '', ...sourceNotes, ''].join('\n'));
  log(`каталог: ${products.length} моделей, новых ${added}, на проверке ${quarantine.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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
import { categoryOf, cleanName, extractSpecs, gpuChip, missingFields } from './normalize';
import { type FeedOffer, icecatEnabled, icecatLookup, loadFeeds, saveIcecatCache } from './sources';
import { OUT, log, readJson, slugify, today, writeJson, writeText } from './util';

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

  const feeds = await loadFeeds();
  const relevant = feeds.filter((o) => categoryOf(o.category));
  log(`в нужных категориях: ${relevant.length} предложений`);

  // Group offers of one model across stores
  const groups = new Map<string, FeedOffer[]>();
  for (const o of relevant) {
    const key = offerKey(o);
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }

  const unknown = new Map<string, number>();
  const quarantine: Array<{ title: string; category: CategoryId; missing: string[]; stores: string[] }> = [];
  let added = 0;
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
    const name = chip?.name ?? cleanName(sheet?.name || first.title, brand);
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
      '## Не добавлены: не хватает полей для проверки совместимости',
      '',
      'Допишите поля в `data/overrides.json` или дождитесь, пока источник их заполнит.',
      '',
      ...(quarantine.length
        ? ['| Категория | Модель | Не хватает | Магазины |', '|---|---|---|---|', ...quarantine.map((q) => `| ${q.category} | ${q.title} | ${q.missing.join(', ')} | ${q.stores.join(', ')} |`)]
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
  log(`каталог: ${products.length} моделей, новых ${added}, на проверке ${quarantine.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

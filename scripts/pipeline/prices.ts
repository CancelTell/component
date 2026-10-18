/*
  Price update: every store offer is matched to a catalog model; per model and store the cheapest
  in-stock offer is kept. Also appends today's lowest price to the price history.

  npm run data:prices
  npm run data:prices -- --fixtures
*/
import type { Offer } from '../../src/data/offers';
import { storeById } from '../../src/data/stores';
import type { Product } from '../../src/data/types';
import { buildIndex, matchOffer } from './match';
import { categoryOf } from './normalize';
import { feedUrls, loadFeeds } from './sources';
import { FIXTURES, OUT, log, readJson, today, writeJson, writeText } from './util';

export interface OffersFile {
  updatedAt: string;
  offers: Record<string, Offer[]>;
}
type History = Record<string, Array<[date: string, minPrice: number]>>;

async function main() {
  if (!FIXTURES && !Object.values(feedUrls).some(Boolean)) {
    log('фиды магазинов не настроены (FEED_DNS, FEED_OZON, ...): цены не обновляю, сайт показывает демо-цены');
    return;
  }

  const catalog = readJson<{ products: Product[] }>(`${OUT}/catalog.json`, { products: [] });
  const index = buildIndex(catalog.products);
  const feeds = await loadFeeds();
  const now = new Date().toISOString();

  const best = new Map<string, Map<string, Offer>>();
  const unmatched = new Map<string, number>();
  let used = 0;

  for (const o of feeds) {
    const category = categoryOf(o.category);
    if (!category) continue;
    const product = matchOffer(o, index);
    if (!product) {
      unmatched.set(`${category}: ${o.title}`, o.price);
      continue;
    }
    used++;
    const perStore = best.get(product.slug) ?? new Map<string, Offer>();
    const cur = perStore.get(o.store);
    const candidate: Offer = { store: storeById[o.store].name, storeId: o.store, price: o.price, inStock: o.inStock, url: o.url, updatedAt: now };
    // In stock beats out of stock, then the lower price
    if (!cur || (candidate.inStock && !cur.inStock) || (candidate.inStock === cur.inStock && (candidate.price ?? Infinity) < (cur.price ?? Infinity))) {
      perStore.set(o.store, candidate);
    }
    best.set(product.slug, perStore);
  }

  const offers: OffersFile['offers'] = {};
  for (const [slug, perStore] of [...best.entries()].sort()) offers[slug] = [...perStore.values()].sort((a, b) => a.storeId.localeCompare(b.storeId));
  writeJson(`${OUT}/offers.json`, { updatedAt: now, offers } satisfies OffersFile);

  // History: one point per model per day (lowest in-stock price)
  const history = readJson<History>(`${OUT}/price-history.json`, {});
  const day = today();
  for (const [slug, list] of Object.entries(offers)) {
    const prices = list.filter((x) => x.inStock && x.price !== null).map((x) => x.price!);
    if (!prices.length) continue;
    const min = Math.min(...prices);
    const points = (history[slug] ?? []).filter(([d]) => d !== day);
    points.push([day, min]);
    history[slug] = points.slice(-365);
  }
  writeJson(`${OUT}/price-history.json`, history);

  const withPrice = Object.keys(offers).length;
  writeText(
    `${OUT}/prices-report.md`,
    [
      `# Отчёт цен, ${day}`,
      '',
      `- Моделей с ценами: **${withPrice}** из ${catalog.products.length}`,
      `- Предложений привязано: ${used}`,
      `- Не привязано (нет такой модели в каталоге): ${unmatched.size}`,
      '',
      '## Примеры непривязанных предложений',
      '',
      'Если модель должна была найтись, добавьте её код (`mpn`) или штрихкод (`ean`) в `data/overrides.json`.',
      '',
      ...[...unmatched.keys()].slice(0, 40).map((t) => `- ${t}`),
      '',
    ].join('\n'),
  );
  log(`цены: ${withPrice} моделей с ценами, привязано ${used} предложений, не привязано ${unmatched.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

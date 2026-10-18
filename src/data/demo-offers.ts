/**
 * DEMO prices. Approximate market prices in roubles with a deterministic per-store spread,
 * so the cart and price analysis can be shown before real store feeds are connected.
 * Delete this file (and the import in offers.ts) once a real source fills offersBySlug.
 */
import { products } from './index';
import { stores, type StoreId } from './stores';
import type { Offer } from './offers';

const basePrice: Record<string, number> = {
  // CPU
  'amd-ryzen-5-5600': 9000, 'amd-ryzen-5-7600': 17000, 'amd-ryzen-7-7700': 24000, 'amd-ryzen-7-9700x': 30000,
  'amd-ryzen-7-7800x3d': 42000, 'amd-ryzen-9-9950x': 62000, 'intel-core-i5-14400f': 15000,
  'intel-core-i5-14600k': 27000, 'intel-core-i7-14700k': 36000,
  // GPU
  'amd-radeon-rx-7600': 27000, 'intel-arc-b580': 29000, 'nvidia-geforce-rtx-4060': 32000,
  'amd-radeon-rx-7800-xt': 55000, 'nvidia-geforce-rtx-5070': 62000, 'nvidia-geforce-rtx-4070-super': 68000,
  'nvidia-geforce-rtx-4080-super': 110000,
  // Motherboards
  'gigabyte-b760-ds3h-ddr4': 11000, 'msi-mag-b550-tomahawk': 13000, 'msi-pro-b760m-a-wifi': 13500,
  'gigabyte-b650m-aorus-elite-ax': 16500, 'asus-tuf-gaming-b650-plus-wifi': 19000, 'asus-prime-z790-p-wifi': 21000,
  'msi-mag-b650-tomahawk-wifi': 22000, 'asus-rog-strix-x670e-e-gaming-wifi': 48000,
  // RAM
  'kingston-fury-beast-ddr4-3200-2x16': 6500, 'corsair-vengeance-lpx-ddr4-3600-2x16': 7200,
  'corsair-vengeance-ddr5-5600-2x16': 9500, 'kingston-fury-beast-ddr5-6000-2x16': 10500,
  'gskill-trident-z5-neo-rgb-ddr5-6000-2x16': 13500,
  // Storage
  'kingston-nv2-1tb': 5600, 'samsung-870-evo-1tb': 8500, 'wd-black-sn850x-1tb': 9800,
  'samsung-990-pro-2tb': 17500, 'crucial-t700-2tb': 24000,
  // PSU
  'msi-mag-a550bn': 4300, 'deepcool-pk650d': 5200, 'corsair-rm750e-2023': 10500,
  'be-quiet-pure-power-12-m-850w': 12500, 'seasonic-focus-gx-1000-atx3': 19000,
  // Cooling
  'deepcool-ak400': 2300, 'thermalright-peerless-assassin-120-se': 3200, 'be-quiet-dark-rock-pro-5': 9000,
  'arctic-liquid-freezer-iii-360': 9500, 'noctua-nh-d15': 11500,
  // Cases
  'cooler-master-masterbox-q300l': 4200, 'nzxt-h5-flow': 8500, 'lian-li-lancool-216': 9000,
  'fractal-design-north': 13500,
};

/** Typical store markup relative to the base price */
const storeBias: Record<StoreId, number> = { dns: 1, ozon: 0.97, citilink: 1.01, mvideo: 1.05 };

/** Small stable hash → [0, 1) */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export function buildDemoOffers(): Record<string, Offer[]> {
  const out: Record<string, Offer[]> = {};
  for (const p of products) {
    const base = basePrice[p.slug];
    if (!base) continue;
    out[p.slug] = stores.map((s) => {
      const r = rand(`${p.slug}:${s.id}`);
      const price = Math.round((base * storeBias[s.id] * (0.94 + r * 0.12)) / 100) * 100 - 10;
      // М.Видео carries fewer PC parts; others are out of stock now and then
      const inStock = s.id === 'mvideo' ? r > 0.45 : r > 0.12;
      return { store: s.name, storeId: s.id, price, inStock, url: s.search(`${p.brand} ${p.name}`), updatedAt: '2026-10-18' };
    });
  }
  return out;
}

import type { Product } from '@/data/types';
import { bestOffer, getCategoryProducts } from './catalog-client';
import { buildSlots, estimatePower, runChecks, slotCategory, type Build, type BuildSlugs, type SlotId } from './compatibility';

const price = (p: Product) => bestOffer(p.slug)?.price ?? null;
const num = (p: Product, key: string) => (typeof p.specs[key] === 'number' ? (p.specs[key] as number) : 0);
const has = (p: Product, key: string, value: string) => {
  const v = p.specs[key];
  return Array.isArray(v) ? v.includes(value) : v === value;
};

/** In-stock products of a category, cheapest first. The categories must be loaded (useCatalog). */
function pool(slot: SlotId): Array<{ p: Product; price: number }> {
  if (slot === 'storage2') return [];
  return getCategoryProducts(slotCategory(slot))
    .flatMap((p) => {
      const pr = price(p);
      return pr === null ? [] : [{ p, price: pr }];
    })
    .sort((a, b) => a.price - b.price);
}

const ok = (build: Build, slot: SlotId) =>
  runChecks(build).every((c) => !c.slots.includes(slot) || c.status === 'ok' || c.status === 'pending' || c.status === 'unknown');

export interface AutoBuild {
  slots: BuildSlugs;
  total: number;
}

/**
 * Picks a compatible build within the budget. For every CPU + GPU pair the rest is chosen
 * as the cheapest part that passes the checks; among the pairs that fit, the one that puts
 * the most money into the GPU (then the CPU) wins — a sensible bias for a home/gaming PC.
 */
export function autoBuild(budget: number): AutoBuild | null {
  const pools = Object.fromEntries(buildSlots.map((s) => [s, pool(s)])) as Record<SlotId, ReturnType<typeof pool>>;
  let best: { build: Build; total: number; score: number } | null = null;

  for (const cpu of pools.cpu) {
    for (const gpu of pools.gpu) {
      if (cpu.price + gpu.price > budget * 0.75) continue;
      // Balanced for games: the GPU gets at least as much as the CPU
      if (gpu.price < cpu.price) continue;
      const build: Build = { cpu: cpu.p, gpu: gpu.p };
      let total = cpu.price + gpu.price;

      const pick = (slot: SlotId, extra: (p: Product) => boolean = () => true) => {
        const found = pools[slot].find(({ p }) => extra(p) && ok({ ...build, [slot]: p }, slot));
        if (!found) return false;
        build[slot] = found.p;
        total += found.price;
        return true;
      };

      const hot = num(cpu.p, 'tdp') > 105;
      const picked =
        pick('motherboard') &&
        pick('ram') &&
        pick('storage', (p) => has(p, 'type', 'NVMe')) &&
        // Hot CPUs get a dual-fan tower or a liquid cooler
        pick('cooling', (p) => !hot || num(p, 'radiator') > 0 || !String(p.specs.fans ?? '').startsWith('1 ')) &&
        pick('psu', (p) => num(p, 'wattage') >= estimatePower(build).recommended) &&
        pick('case');
      if (!picked || total > budget) continue;

      const score = gpu.price + cpu.price * 0.7;
      if (!best || score > best.score || (score === best.score && total < best.total)) best = { build, total, score };
    }
  }

  if (!best) return null;
  const slots: BuildSlugs = {};
  for (const s of buildSlots) if (best.build[s]) slots[s] = best.build[s]!.slug;
  return { slots, total: best.total };
}

/** Cheapest possible complete build — the lower bound for the budget slider */
export const minBudget = () => {
  for (let b = 30000; b <= 600000; b += 5000) if (autoBuild(b)) return b;
  return 600000;
};

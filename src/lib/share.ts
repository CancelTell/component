'use client';

import { getProduct } from '@/data';
import { buildSlots, isSlot, type BuildSlugs } from './compatibility';

/** Build → "?build=cpu:amd-ryzen-5-7600,gpu:nvidia-geforce-rtx-4060" */
export function shareUrl(slots: BuildSlugs): string {
  const value = buildSlots.flatMap((s) => (slots[s] ? [`${s}:${slots[s]}`] : [])).join(',');
  // Slugs are url-safe, so the link stays readable
  return `${window.location.origin}/compatibility?build=${value}`;
}

/** Reads a shared build, ignoring unknown slots and models */
export function parseShared(value: string | null): BuildSlugs | null {
  if (!value) return null;
  const slots: BuildSlugs = {};
  for (const pair of value.split(',')) {
    const [slot, slug] = pair.split(':');
    if (slot && slug && isSlot(slot as never) && getProduct(slug)?.category === slot) slots[slot as keyof BuildSlugs] = slug;
  }
  return Object.keys(slots).length ? slots : null;
}

/** Native share sheet on phones, clipboard elsewhere */
export async function shareBuild(slots: BuildSlugs, title: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = shareUrl(slots);
  try {
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

'use client';

import { Check, Plus } from 'lucide-react';
import type { Product } from '@/data/types';
import { COMPARE_LIMIT, useCompare } from '@/lib/compare-store';
import { flyToCompare } from '@/lib/fly-to-compare';

interface Props {
  product: Product;
  block?: boolean;
}

export function CompareButton({ product, block = false }: Props) {
  const { has, toggle, isFull } = useCompare();
  const active = has(product.slug);
  const disabled = !active && isFull(product.category);

  return (
    <button
      type="button"
      className={`btn ${active ? 'btn--primary' : 'btn--outline'}${block ? ' btn--block' : ''}`}
      aria-pressed={active}
      disabled={disabled}
      title={disabled ? `В сравнении уже ${COMPARE_LIMIT} модели этой категории` : undefined}
      onClick={(e) => {
        if (!active) flyToCompare(e.currentTarget);
        toggle(product);
      }}
    >
      {active ? <Check size={20} strokeWidth={2.5} aria-hidden="true" /> : <Plus size={18} strokeWidth={2.5} aria-hidden="true" />}
      {active ? 'В сравнении' : 'В сравнение'}
    </button>
  );
}

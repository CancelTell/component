'use client';

import { Check, Plus } from 'lucide-react';
import type { Product } from '@/data/types';
import { COMPARE_LIMIT, useCompareList } from '@/lib/compare-store';

interface Props {
  product: Pick<Product, 'slug' | 'category'>;
  block?: boolean;
  /** Icon-only button for dense table rows */
  compact?: boolean;
}

export function CompareButton({ product, block = false, compact = false }: Props) {
  const { has, toggle, isFull } = useCompareList();
  const active = has(product.slug);
  const disabled = !active && isFull(product.category);

  return (
    <button
      type="button"
      className={`btn ${active ? 'btn--primary' : 'btn--outline'}${block ? ' btn--block' : ''}${compact ? ' btn--icon btn--sm' : ''}`}
      aria-label={compact ? (active ? 'Убрать из сравнения' : 'Добавить в сравнение') : undefined}
      aria-pressed={active}
      disabled={disabled}
      title={disabled ? `В сравнении уже ${COMPARE_LIMIT} модели этой категории` : undefined}
      onClick={() => toggle(product)}
    >
      {active ? <Check size={20} strokeWidth={2.5} aria-hidden="true" /> : <Plus size={18} strokeWidth={2.5} aria-hidden="true" />}
      {!compact && (active ? 'В сравнении' : 'В сравнение')}
    </button>
  );
}

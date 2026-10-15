'use client';

import Link from 'next/link';
import type { CategoryId } from '@/data/types';
import { COMPARE_LIMIT, useCompare } from '@/lib/compare-store';

/** Sticky bar at the bottom of a category page while something is selected for comparison */
export function ComparisonBar({ category }: { category: CategoryId }) {
  const { inCategory } = useCompare();
  const count = inCategory(category).length;
  if (count === 0) return null;

  return (
    <div className="compare-bar" role="region" aria-label="Сравнение">
      <div className="container compare-bar__inner">
        <div aria-live="polite">
          <span className="compare-bar__label">В сравнении</span>
          <span className="compare-bar__value">
            {count} из {COMPARE_LIMIT} моделей
          </span>
        </div>
        <Link href={`/compare?category=${category}`} className="btn btn--accent">
          Сравнить
        </Link>
      </div>
    </div>
  );
}

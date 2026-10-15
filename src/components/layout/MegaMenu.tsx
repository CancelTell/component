'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { categories, categoryById, countByCategory, getProductsByCategory } from '@/data';
import type { CategoryId } from '@/data/types';
import { productHref, productSummary } from '@/lib/catalog';
import { isSlot } from '@/lib/compatibility';
import { modelsLabel } from '@/lib/format';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

export type MegaMenuId = CategoryId | 'all';

interface Props {
  id: MegaMenuId;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/** Drop-down panel under the header, opened by hovering or focusing a nav item */
export function MegaMenu({ id, onMouseEnter, onMouseLeave }: Props) {
  return (
    <div className="mega" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="container mega__inner" key={id}>
        {id === 'all' ? <AllCategories /> : <CategoryPanel id={id} />}
      </div>
    </div>
  );
}

function AllCategories() {
  return (
    <ul className="mega__all" role="list">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/catalog/${c.id}`} className="mega__cat">
            <span className="icon-box">
              <CategoryIcon name={c.icon} />
            </span>
            <span className="mega__cat-text">
              <span className="mega__cat-name">{c.name}</span>
              <span className="mega__cat-count">{modelsLabel(countByCategory(c.id))}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CategoryPanel({ id }: { id: CategoryId }) {
  const config = categoryById[id];
  const popular = getProductsByCategory(id).slice(0, 4);
  const count = countByCategory(id);

  return (
    <div className="mega__grid">
      <div className="mega__about">
        <span className="icon-box">
          <CategoryIcon name={config.icon} />
        </span>
        <p className="mega__title">{config.name}</p>
        <p className="mega__desc">{config.description}</p>
        <div className="mega__about-actions">
          <Link href={`/catalog/${id}`} className="btn btn--accent">
            Все {modelsLabel(count)}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {isSlot(id) && (
            <Link href="/compatibility" className="link mega__compat">
              Проверить совместимость
            </Link>
          )}
        </div>
      </div>

      <div className="mega__col">
        <p className="mega__label">Быстрый выбор</p>
        <ul className="chips" role="list">
          {config.quickFilters.map(([groupId, optionId]) => {
            const option = config.filters.find((g) => g.id === groupId)?.options.find((o) => o.id === optionId);
            if (!option) return null;
            return (
              <li key={`${groupId}:${optionId}`}>
                <Link href={`/catalog/${id}?${groupId}=${optionId}`} className="chip">
                  {option.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mega__col">
        <p className="mega__label">Популярные модели</p>
        <ul className="mega__models" role="list">
          {popular.map((p) => (
            <li key={p.slug}>
              <Link href={productHref(p)} className="similar">
                <span>
                  <span className="similar__name">
                    {p.brand} {p.name}
                  </span>
                  <span className="similar__sub">{productSummary(p)}</span>
                </span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { categories, categoryById } from '@/data/categories';
import type { NavCategory } from '@/data/nav';
import type { CategoryId } from '@/data/types';
import { modelsLabel } from '@/lib/format';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Thumb } from '@/components/ui/Thumb';

export type MegaMenuId = 'parts';

interface Props {
  id: MegaMenuId;
  nav: NavCategory[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/** «Комплектующие»: categories on the left, quick filters and popular models of the hovered one on the right */
export function MegaMenu({ nav, onMouseEnter, onMouseLeave }: Props) {
  const [active, setActive] = useState<CategoryId>('cpu');
  const byId = new Map(nav.map((n) => [n.id, n]));
  const config = categoryById[active];
  const info = byId.get(active);

  return (
    <div className="mega" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="container mega__inner">
        <div className="mega__parts">
          <ul className="mega__cats" role="list">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/catalog/${c.id}`}
                  className="mega__cat"
                  data-active={c.id === active || undefined}
                  onMouseEnter={() => setActive(c.id)}
                  onFocus={() => setActive(c.id)}
                >
                  <CategoryIcon name={c.icon} size={18} />
                  <span className="mega__cat-name">{c.name}</span>
                  <span className="mega__cat-count num">{byId.get(c.id)?.count ?? ''}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/catalog" className="mega__all">
                Все категории
              </Link>
            </li>
          </ul>

          <div className="mega__detail" key={active}>
            <div className="mega__col">
              <Thumb icon={config.icon} width={260} height={104} draw spin className="mega__art" />
              <p className="mega__desc">{config.description}</p>
              <p className="mega__label">Быстрый выбор</p>
              <ul className="chips" role="list">
                {config.quick.map(([key, value]) => (
                  <li key={`${key}:${value}`}>
                    <Link href={`/catalog/${active}?${key}=${encodeURIComponent(value)}`} className="chip chip--sm">
                      {value}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`/catalog/${active}`} className="btn btn--outline btn--sm mega__go">
                {config.name}: {modelsLabel(info?.count ?? 0)}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="mega__col">
              <p className="mega__label">Популярные</p>
              <ul className="mega__models" role="list">
                {info?.popular.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className="similar">
                      <span>
                        <span className="similar__name">{p.name}</span>
                        <span className="similar__sub">{p.summary}</span>
                      </span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

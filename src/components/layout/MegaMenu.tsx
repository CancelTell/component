'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, BookOpen, ChevronRight, ShoppingCart, Wallet, Wrench } from 'lucide-react';
import { categories, categoryById, countByCategory, getProductsByCategory } from '@/data';
import { presets } from '@/data/presets';
import { useBuild } from '@/lib/build-store';
import { buildProducts } from '@/lib/cart-store';
import { priceBuild, rub } from '@/lib/pricing';
import type { CategoryId } from '@/data/types';
import { productHref, productSummary } from '@/lib/catalog';
import { isSlot } from '@/lib/compatibility';
import { modelsLabel } from '@/lib/format';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';

export type MegaMenuId = 'parts' | 'build';

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
        {id === 'parts' ? <PartsPanel /> : <BuildPanel />}
      </div>
    </div>
  );
}

/** "Комплектующие": category list on the left, details of the hovered category on the right */
function PartsPanel() {
  const [active, setActive] = useState<CategoryId>('cpu');
  return (
    <div className="mega__parts">
      <ul className="mega__cats" role="list">
        {categories.map((c, i) => (
          <li key={c.id} className="mega__item" style={{ ...artStyle(c.icon), ['--i' as string]: i * 0.5 } as CSSProperties}>
            <Link
              href={`/catalog/${c.id}`}
              className="mega__cat"
              data-active={c.id === active || undefined}
              onMouseEnter={() => setActive(c.id)}
              onFocus={() => setActive(c.id)}
            >
              <span className="mega__cat-icon">
                <CategoryIcon name={c.icon} size={20} />
              </span>
              <span className="mega__cat-text">
                <span className="mega__cat-name">{c.name}</span>
                <span className="mega__cat-count">{modelsLabel(countByCategory(c.id))}</span>
              </span>
              <ChevronRight size={16} className="mega__cat-arrow" aria-hidden="true" />
            </Link>
          </li>
        ))}
        <li className="mega__item mega__cats-all" style={{ ['--i' as string]: 4 } as CSSProperties}>
          <Link href="/catalog" className="link">
            Весь каталог
          </Link>
        </li>
      </ul>
      <div className="mega__detail" key={active}>
        <CategoryPanel id={active} />
      </div>
    </div>
  );
}

function BuildLink({ href, icon, title, text, i }: { href: string; icon: ReactNode; title: string; text: string; i: number }) {
  return (
    <li className="mega__item" style={{ ['--i' as string]: i } as CSSProperties}>
      <Link href={href} className="mega__tool">
        <span className="mega__tool-icon" aria-hidden="true">
          {icon}
        </span>
        <span>
          <span className="mega__tool-title">{title}</span>
          <span className="mega__tool-text">{text}</span>
        </span>
      </Link>
    </li>
  );
}

/** "Сборка": tools on the left, ready-made builds on the right */
function BuildPanel() {
  const { load } = useBuild();
  const router = useRouter();
  return (
    <div className="mega__build">
      <ul className="mega__tools" role="list">
        <BuildLink i={0} href="/compatibility" icon={<Wrench size={20} />} title="Конструктор" text="Выберите детали, сайт проверит совместимость и посчитает цену" />
        <BuildLink i={1} href="/compatibility" icon={<Wallet size={20} />} title="Подбор под бюджет" text="Укажите сумму и получите совместимый комплект" />
        <BuildLink i={2} href="/cart" icon={<ShoppingCart size={20} />} title="Корзина сборок" text="Сохранённые сборки и где их дешевле купить" />
        <BuildLink i={3} href="/guide" icon={<BookOpen size={20} />} title="Инструкция по сборке" text="Как собрать компьютер своими руками" />
      </ul>
      <div className="mega__item mega__presets" style={{ ['--i' as string]: 2 } as CSSProperties}>
        <p className="mega__label">Готовые сборки</p>
        <ul className="mega__models" role="list">
          {presets.map((p, k) => (
            <li key={p.id} className="mega__model" style={{ ['--k' as string]: k } as CSSProperties}>
              <button
                type="button"
                className="similar mega__preset"
                onClick={() => {
                  load(p.slots);
                  router.push('/compatibility');
                }}
              >
                <span>
                  <span className="similar__name">{p.name}</span>
                  <span className="similar__sub">{p.note}</span>
                </span>
                <span className="mega__preset-price">{rub(priceBuild(buildProducts(p.slots)).split.total)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CategoryPanel({ id }: { id: CategoryId }) {
  const config = categoryById[id];
  const popular = getProductsByCategory(id).slice(0, 4);
  const count = countByCategory(id);

  return (
    <div className="mega__grid" style={artStyle(config.icon)}>
      <div className="mega__about mega__item" style={{ ['--i' as string]: 0 } as CSSProperties}>
        <div className="mega__art">
          <ComponentArt name={config.icon} className="art--draw art--spin" />
        </div>
        <p className="mega__title">{config.name}</p>
        <p className="mega__desc">{config.description}</p>
        <div className="mega__about-actions">
          <Link href={`/catalog/${id}`} className="btn btn--accent mega__all-btn">
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

      <div className="mega__col mega__item" style={{ ['--i' as string]: 1 } as CSSProperties}>
        <p className="mega__label">Быстрый выбор</p>
        <ul className="chips" role="list">
          {config.quickFilters.map(([groupId, optionId], k) => {
            const option = config.filters.find((g) => g.id === groupId)?.options.find((o) => o.id === optionId);
            if (!option) return null;
            return (
              <li key={`${groupId}:${optionId}`} className="mega__chip" style={{ ['--k' as string]: k } as CSSProperties}>
                <Link href={`/catalog/${id}?${groupId}=${optionId}`} className="chip">
                  {option.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mega__col mega__item" style={{ ['--i' as string]: 2 } as CSSProperties}>
        <p className="mega__label">Популярные модели</p>
        <ul className="mega__models" role="list">
          {popular.map((p, k) => (
            <li key={p.slug} className="mega__model" style={{ ['--k' as string]: k } as CSSProperties}>
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

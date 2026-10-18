'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Cpu, Menu, Search, ShoppingCart, X } from 'lucide-react';
import { categories } from '@/data';
import { useCompare } from '@/lib/compare-store';
import { useCart } from '@/lib/cart-store';
import { MegaMenu, type MegaMenuId } from './MegaMenu';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { artStyle } from '@/components/ui/ComponentArt';
import { ThemeToggle } from './ThemeToggle';

/** `mega` — which hover panel the item opens; items without it are plain links */
const navItems: Array<{ href: string; label: string; mega?: MegaMenuId; match: string[] }> = [
  { href: '/catalog', label: 'Комплектующие', mega: 'parts', match: ['/catalog', '/search'] },
  { href: '/compatibility', label: 'Сборка', mega: 'build', match: ['/compatibility', '/cart'] },
  { href: '/guide', label: 'Инструкция по сборке', match: ['/guide'] },
];

const OPEN_DELAY = 120;
const CLOSE_DELAY = 200;

export function Header() {
  const pathname = usePathname();
  const { count } = useCompare();
  const { count: cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mega, setMega] = useState<MegaMenuId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sliding highlight that follows the hovered nav item
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  const movePill = (el: HTMLElement) => setPill({ left: el.offsetLeft, width: el.offsetWidth, visible: true });

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // Open with a short delay so the panel doesn't flicker when the cursor just passes over the nav;
  // switch instantly when a panel is already open.
  const openMega = (id: MegaMenuId) => {
    clearTimer();
    if (mega) setMega(id);
    else timer.current = setTimeout(() => setMega(id), OPEN_DELAY);
  };
  const scheduleClose = () => {
    clearTimer();
    timer.current = setTimeout(() => setMega(null), CLOSE_DELAY);
  };
  const closeMega = useCallback(() => {
    clearTimer();
    setMega(null);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    closeMega();
  }, [pathname, closeMega]);

  useEffect(() => {
    document.body.classList.toggle('is-locked', menuOpen);
    if (!menuOpen && !mega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      closeMega();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, mega, closeMega]);

  useEffect(() => clearTimer, []);

  const isActive = (match: string[]) => match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <header className={`header${mega ? ' header--mega' : ''}`} onMouseLeave={scheduleClose}>
      <div className="container header__inner">
        <Link href="/" className="brand" aria-label="COMPONENT — на главную">
          <span className="brand__badge">
            <Cpu size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="brand__name">COMPONENT</span>
        </Link>

        <nav
          className="nav"
          aria-label="Основная навигация"
          onMouseLeave={() => setPill((p) => ({ ...p, visible: false }))}
        >
          <span
            className="nav__pill"
            aria-hidden="true"
            data-visible={pill.visible || undefined}
            style={{ left: pill.left, width: pill.width }}
          />
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav__link"
              aria-current={isActive(item.match) ? 'page' : undefined}
              aria-expanded={item.mega ? mega === item.mega : undefined}
              aria-haspopup={item.mega ? 'true' : undefined}
              data-open={(item.mega && mega === item.mega) || undefined}
              onMouseEnter={(e) => {
                movePill(e.currentTarget);
                if (item.mega) openMega(item.mega);
                else scheduleClose();
              }}
              onFocus={(e) => {
                movePill(e.currentTarget);
                if (item.mega) openMega(item.mega);
                else closeMega();
              }}
            >
              {item.label}
              {item.mega && <ChevronDown size={14} className="nav__chevron" aria-hidden="true" />}
            </Link>
          ))}
        </nav>

        <div className="header__actions" onMouseEnter={scheduleClose}>
          <Link href="/search" className="btn btn--outline btn--icon header__search" aria-label="Поиск">
            <Search size={20} />
          </Link>
          <ThemeToggle />
          <Link
            href="/cart"
            className="btn btn--outline btn--icon header__cart"
            aria-label={cartCount > 0 ? `Корзина: ${cartCount}` : 'Корзина'}
            aria-current={pathname === '/cart' ? 'page' : undefined}
            data-cart-target
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="btn__badge header__cart-badge">{cartCount}</span>}
          </Link>
          <Link href="/compare" className="btn btn--outline header__compare" data-compare-target>
            Сравнение
            {count > 0 && <span className="btn__badge">{count}</span>}
          </Link>
          <button
            type="button"
            className="btn btn--outline btn--icon header__menu-btn"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} className="header__close-icon" /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mega && <MegaMenu id={mega} onMouseEnter={clearTimer} onMouseLeave={scheduleClose} />}
      {mega && <div className="mega-backdrop" aria-hidden="true" onMouseEnter={scheduleClose} />}

      {menuOpen && (
        <div id="mobile-menu" className="mobile-menu">
          <div className="container">
            <p className="mobile-menu__label">Комплектующие</p>
            <nav aria-label="Категории">
              <ul className="mobile-menu__grid" role="list">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/catalog/${c.id}`} className="mobile-menu__cat" style={artStyle(c.icon)}>
                      <span className="mobile-menu__cat-icon" aria-hidden="true">
                        <CategoryIcon name={c.icon} size={18} />
                      </span>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="mobile-menu__label">Разделы</p>
            <ul className="mobile-menu__list" role="list">
              {[
                ['/compatibility', 'Конструктор и подбор под бюджет'],
                ['/cart', `Корзина сборок${cartCount ? ` · ${cartCount}` : ''}`],
                ['/guide', 'Инструкция по сборке'],
                ['/compare', `Сравнение${count ? ` · ${count}` : ''}`],
                ['/about', 'О проекте'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href!} className="mobile-menu__link">
                    {label}
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Cpu, Menu, Search, X } from 'lucide-react';
import { categories } from '@/data';
import { useCompare } from '@/lib/compare-store';
import { MegaMenu, type MegaMenuId } from './MegaMenu';
import { ThemeToggle } from './ThemeToggle';

const navItems: Array<{ id: MegaMenuId; href: string; label: string; wide?: boolean; muted?: boolean }> = [
  { id: 'cpu', href: '/catalog/cpu', label: 'Процессоры' },
  { id: 'gpu', href: '/catalog/gpu', label: 'Видеокарты' },
  { id: 'motherboard', href: '/catalog/motherboard', label: 'Материнские платы' },
  { id: 'ram', href: '/catalog/ram', label: 'Память', wide: true },
  { id: 'all', href: '/catalog', label: 'Все категории', muted: true },
];

const OPEN_DELAY = 120;
const CLOSE_DELAY = 200;

export function Header() {
  const pathname = usePathname();
  const { count } = useCompare();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mega, setMega] = useState<MegaMenuId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const isActive = (href: string) =>
    href === '/catalog' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`header${mega ? ' header--mega' : ''}`} onMouseLeave={scheduleClose}>
      <div className="container header__inner">
        <Link href="/" className="brand" aria-label="COMPONENT — на главную">
          <span className="brand__badge">
            <Cpu size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="brand__name">COMPONENT</span>
        </Link>

        <nav className="nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`nav__link${item.wide ? ' nav__link--wide' : ''}${item.muted ? ' nav__link--muted' : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
              aria-expanded={mega === item.id}
              aria-haspopup="true"
              data-open={mega === item.id || undefined}
              onMouseEnter={() => openMega(item.id)}
              onFocus={() => openMega(item.id)}
            >
              {item.label}
              <ChevronDown size={14} className="nav__chevron" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <div className="header__actions" onMouseEnter={scheduleClose}>
          <Link href="/search" className="btn btn--outline btn--icon header__search" aria-label="Поиск">
            <Search size={20} />
          </Link>
          <ThemeToggle />
          <Link href="/compare" className="btn btn--outline header__compare">
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
            <nav aria-label="Категории">
              <ul className="mobile-menu__list" role="list">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/catalog/${c.id}`} className="mobile-menu__link">
                      {c.name}
                      <ChevronRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mobile-menu__extra">
              <Link href="/compatibility" className="btn btn--accent btn--lg">
                Проверить сочетаемость
              </Link>
              <Link href="/compare" className="btn btn--outline btn--lg">
                Сравнение
                {count > 0 && <span className="btn__badge">{count}</span>}
              </Link>
              <Link href="/about" className="btn btn--outline btn--lg">
                О проекте
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

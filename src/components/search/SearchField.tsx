'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { categoryById } from '@/data';
import { productHref, productSummary } from '@/lib/catalog';
import { searchProducts } from '@/lib/search';
import { modelsLabel } from '@/lib/format';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface Props {
  defaultValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

const MAX_SUGGESTIONS = 6;

function highlight(text: string, query: string): ReactNode {
  const tokens = query.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (tokens.length === 0) return text;
  const parts = text.split(new RegExp(`(${tokens.join('|')})`, 'gi'));
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
}

/**
 * Search input with live suggestions. Lives inside a plain GET form pointing to /search,
 * so Enter without a highlighted suggestion opens the full results page.
 */
export function SearchField({ defaultValue = '', autoFocus, placeholder = 'Модель, бренд, сокет' }: Props) {
  const router = useRouter();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const trimmed = query.trim();
  const all = useMemo(() => (trimmed ? searchProducts(trimmed) : []), [trimmed]);
  const results = all.slice(0, MAX_SUGGESTIONS);
  const showPanel = open && trimmed.length > 0;
  const allHref = `/search?q=${encodeURIComponent(trimmed)}`;

  useEffect(() => {
    if (!showPanel) return;
    const onPointer = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [showPanel]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!showPanel || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      setOpen(false);
      router.push(productHref(results[active]!));
    }
  };

  return (
    <div className="ac" ref={boxRef}>
      <label className="field">
        <span className="visually-hidden">Поиск по справочнику</span>
        <Search size={20} className="field__icon" aria-hidden="true" />
        <input
          className="field__input"
          type="search"
          name="q"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </label>

      {showPanel && (
        <div className="ac__panel">
          {results.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Подсказки" className="ac__list">
              {results.map((p, i) => {
                const config = categoryById[p.category];
                return (
                  <li key={p.slug} role="presentation">
                    <Link
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      href={productHref(p)}
                      className="ac__item"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => setOpen(false)}
                    >
                      <span className="icon-box ac__icon">
                        <CategoryIcon name={config.icon} size={20} />
                      </span>
                      <span className="ac__text">
                        <span className="ac__name">{highlight(`${p.brand} ${p.name}`, trimmed)}</span>
                        <span className="ac__sub">{productSummary(p)}</span>
                      </span>
                      <span className="ac__cat">{config.singular}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p id={listId} className="ac__empty">
              По запросу «{trimmed}» ничего не нашлось. Попробуйте бренд или сокет, например AM5.
            </p>
          )}
          {results.length > 0 && (
            <Link href={allHref} className="ac__all" onClick={() => setOpen(false)}>
              {all.length > results.length ? `Показать все: ${modelsLabel(all.length)}` : 'Открыть страницу поиска'}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

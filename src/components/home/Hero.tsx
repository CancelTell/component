import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categories, popularQueries, products } from '@/data';
import { stores } from '@/data/stores';
import { modelsLabel } from '@/lib/format';
import { HAS_PRICES } from '@/lib/money';
import { SearchField } from '@/components/search/SearchField';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__main">
        <h1 id="hero-title" className="hero__title">
          Комплектующие для&nbsp;ПК
        </h1>
        <ul className="hero__facts" role="list">
          <li>{modelsLabel(products.length)}</li>
          <li>{categories.length} категорий</li>
          <li>{HAS_PRICES ? `цены в ${stores.map((s) => s.name).join(', ')}` : 'проверка совместимости'}</li>
        </ul>

        <form className="hero-search" action="/search" role="search">
          <div className="hero-search__row">
            <SearchField />
            <button type="submit" className="btn hero-search__submit">
              Найти
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="hero-search__popular">
            <span className="hero-search__label">Часто ищут:</span>
            {popularQueries.map((q) => (
              <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="chip hero-chip">
                {q}
              </Link>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}

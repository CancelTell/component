import Link from 'next/link';
import { popularQueries } from '@/data';
import { SearchField } from '@/components/search/SearchField';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div>
        <p className="hero__eyebrow">Справочник · комплектующие для ПК</p>
        <h1 id="hero-title" className="hero__title">
          Характеристики и сравнение комплектующих
        </h1>
        <p className="hero__desc">
          Найдите модель, сравните до четырёх позиций рядом и проверьте совместимость до покупки
        </p>
      </div>

      <form className="hero-search" action="/search" role="search">
        <div className="hero-search__row">
          <SearchField />
          <button type="submit" className="btn btn--white btn--lg">
            Найти
          </button>
        </div>
        <div className="hero-search__popular">
          <span className="hero-search__label">Часто ищут:</span>
          {popularQueries.map((q) => (
            <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="chip chip--on-dark">
              {q}
            </Link>
          ))}
        </div>
      </form>
    </section>
  );
}

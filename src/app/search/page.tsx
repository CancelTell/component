import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { searchProducts } from '@/lib/search';
import { modelsLabel } from '@/lib/format';
import { SearchField } from '@/components/search/SearchField';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';
import { ProductCard } from '@/components/catalog/ProductCard';

type SearchParams = Promise<{ q?: string | string[] }>;

const readQuery = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100) ?? '';

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = readQuery((await searchParams).q);
  return {
    title: q ? `Поиск: ${q}` : 'Поиск',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = readQuery((await searchParams).q);
  const results = q ? searchProducts(q) : [];

  return (
    <div className="container page">
      <div className="search-page">
        <form className="search-form" action="/search" role="search">
          <SearchField key={q} defaultValue={q} autoFocus={!q} />
          <button type="submit" className="btn btn--accent btn--lg">
            Найти
          </button>
        </form>

        {!q && (
          <>
            <div className="empty-state">
              <h1 className="title-1">Поиск по справочнику</h1>
              <p className="empty-state__text">Введите модель, бренд, сокет или тип памяти — например, «Ryzen 7» или «DDR5».</p>
            </div>
            <SearchSuggestions />
          </>
        )}

        {q && results.length === 0 && (
          <>
            <div className="empty-state">
              <span className="empty-state__icon" aria-hidden="true">
                <Search size={40} strokeWidth={1.5} />
              </span>
              <h1 className="title-1">Ничего не найдено</h1>
              <p className="empty-state__text">По запросу «{q}» совпадений нет. Попробуйте изменить запрос.</p>
            </div>
            <div className="card tips">
              <h2 className="tips__title">Что можно сделать</h2>
              <ul className="tips__list">
                <li>Проверьте написание модели</li>
                <li>Попробуйте искать по бренду или сокету, например AM5</li>
                <li>Уберите лишние фильтры</li>
              </ul>
            </div>
            <SearchSuggestions />
          </>
        )}
      </div>

      {results.length > 0 && (
        <section className="search-results" aria-labelledby="results-title">
          <div>
            <h1 id="results-title" className="title-1">
              «{q}»
            </h1>
            <p className="text-muted">Найдено: {modelsLabel(results.length)}</p>
          </div>
          <div className="results">
            {results.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import Link from 'next/link';
import { categories, popularQueries } from '@/data';

export function SearchSuggestions() {
  return (
    <>
      <div className="suggest">
        <p className="suggest__label">Часто ищут</p>
        <ul className="chips" role="list">
          {popularQueries.map((q) => (
            <li key={q}>
              <Link href={`/search?q=${encodeURIComponent(q)}`} className="chip chip--muted">
                {q}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="suggest">
        <p className="suggest__label">Или откройте категорию</p>
        <ul className="chips" role="list">
          {categories.slice(0, 5).map((c) => (
            <li key={c.id}>
              <Link href={`/catalog/${c.id}`} className="chip">
                {c.id === 'ram' ? 'Память' : c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

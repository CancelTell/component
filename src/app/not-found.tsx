import Link from 'next/link';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';

export default function NotFound() {
  return (
    <div className="container page">
      <div className="search-page">
        <div className="empty-state">
          <span className="empty-state__icon mono" aria-hidden="true">
            404
          </span>
          <h1 className="title-1">Страница не найдена</h1>
          <p className="empty-state__text">Возможно, ссылка устарела или модель убрали из справочника.</p>
          <Link href="/" className="btn btn--accent">
            На главную
          </Link>
        </div>
        <SearchSuggestions />
      </div>
    </div>
  );
}

import Link from 'next/link';
import { categories, countByCategory } from '@/data';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

export function CategoryGrid() {
  return (
    <ul className="category-grid" role="list">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/catalog/${c.id}`} className="card category-tile">
            <span className="category-tile__top">
              <span className="icon-box">
                <CategoryIcon name={c.icon} />
              </span>
              <span className="category-tile__count" aria-label={`моделей: ${countByCategory(c.id)}`}>
                {countByCategory(c.id)}
              </span>
            </span>
            <span className="category-tile__name">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

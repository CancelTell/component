import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки">
      <ol className="breadcrumbs" role="list">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="breadcrumbs__item">
              {i > 0 && <ChevronRight size={14} className="breadcrumbs__sep" aria-hidden="true" />}
              {last || !item.href ? (
                <span aria-current={last ? 'page' : undefined}>{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { categories, categorySummary } from '@/data';
import { modelsLabel } from '@/lib/format';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';

const listBrands = (brands: string[]) =>
  brands.length > 3 ? `${brands.slice(0, 3).join(', ')} и ещё ${brands.length - 3}` : brands.join(', ');

/** Category "folders": on hover the pocket slides down and the component rises out, drawing itself */
export function FolderGrid() {
  return (
    <ul className="folders" role="list">
      {categories.map((c, i) => {
        const summary = categorySummary(c.id);
        return (
          <li key={c.id}>
            <Link
              href={`/catalog/${c.id}`}
              className="folder"
              style={{ ...artStyle(c.icon), ['--i' as string]: i } as CSSProperties}
            >
              <span className="folder__back" aria-hidden="true" />
              <span className="folder__glow" aria-hidden="true" />
              <span className="folder__object" aria-hidden="true">
                <ComponentArt name={c.icon} />
              </span>
              <span className="folder__front">
                <span className="folder__head">
                  <span className="folder__title">{c.name}</span>
                </span>
                <span className="folder__tags" aria-label="Платформы">
                  {summary.platforms.slice(0, 3).map((tag) => (
                    <span key={tag} className="folder__tag">
                      {tag}
                    </span>
                  ))}
                </span>
                <span className="folder__foot">
                  <span className="folder__facts">
                    <span className="folder__count">{modelsLabel(summary.count)}</span>
                    <span className="folder__brands">{listBrands(summary.brands)}</span>
                  </span>
                  <span className="folder__go" aria-hidden="true">
                    <ArrowUpRight size={18} />
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

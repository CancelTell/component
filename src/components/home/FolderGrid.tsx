import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { categories, getProductsByCategory } from '@/data';
import { modelsLabel } from '@/lib/format';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';

const listBrands = (brands: string[]) =>
  brands.length > 3 ? `${brands.slice(0, 3).join(', ')} и ещё ${brands.length - 3}` : brands.join(', ');

/** Platforms of a category with model counts: AM5 34, LGA1700 76… (most common first) */
function summary(id: (typeof categories)[number]['id']) {
  const config = categories.find((c) => c.id === id)!;
  const list = getProductsByCategory(id);
  const counts = new Map<string, number>();
  for (const p of list) {
    const tag = config.meta(p)[1];
    if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const platforms = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const brands = [...new Set(list.map((p) => p.brand))];
  return { count: list.length, platforms, brands };
}

/**
 * Category "folders": on hover the pocket slides down and the part rises out, drawing itself.
 * The front shows what the category holds: platforms with counts and their share.
 */
export function FolderGrid() {
  return (
    <ul className="folders" role="list">
      {categories.map((c, i) => {
        const s = summary(c.id);
        const top = s.platforms.slice(0, 3);
        return (
          <li key={c.id}>
            <Link href={`/catalog/${c.id}`} className="folder" style={{ ...artStyle(c.icon), ['--i' as string]: i } as CSSProperties}>
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
                  {top.map(([tag, n]) => (
                    <span key={tag} className="folder__tag">
                      {tag}
                      <b>{n}</b>
                    </span>
                  ))}
                </span>
                {s.count > 0 && (
                  <span className="folder__bar" aria-hidden="true">
                    {top.map(([tag, n], k) => (
                      <span key={tag} style={{ ['--w' as string]: `${(n / s.count) * 100}%`, ['--k' as string]: k } as CSSProperties} />
                    ))}
                  </span>
                )}
                <span className="folder__foot">
                  <span className="folder__facts">
                    <span className="folder__count">{modelsLabel(s.count)}</span>
                    <span className="folder__brands">{listBrands(s.brands)}</span>
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

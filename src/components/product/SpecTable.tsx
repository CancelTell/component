import { categoryById } from '@/data/categories';
import type { Product } from '@/data/types';
import { formatSpec } from '@/lib/format';

export function SpecTable({ product }: { product: Product }) {
  const config = categoryById[product.category];

  return (
    <section aria-labelledby="specs-title" className="specs">
      <h2 id="specs-title" className="title-2">
        Характеристики
      </h2>
      {config.groups.map((group) => (
        <div key={group.title} className="card spec-group">
          <h3 className="spec-group__title">{group.title}</h3>
          <dl>
            {group.specs.map((def) => (
              <div key={def.key} className="spec-row">
                <dt>{def.label}</dt>
                <dd className={def.mono ? 'mono' : undefined}>{formatSpec(product, def)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}

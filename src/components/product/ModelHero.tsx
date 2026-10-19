import Link from 'next/link';
import { Flag, Wrench } from 'lucide-react';
import { catalogDate } from '@/data';
import { categoryById } from '@/data/categories';
import type { DataSource, Product } from '@/data/types';
import { getStats, productHref } from '@/lib/catalog';
import { inBuild } from '@/lib/compatibility';
import { siteConfig } from '@/lib/site';
import { Thumb } from '@/components/ui/Thumb';
import { Stat } from '@/components/ui/Stat';
import { CompareButton } from '@/components/catalog/CompareButton';

const sourceLabel: Record<DataSource, string> = {
  manual: 'данные производителя, проверены вручную',
  wikipedia: 'Википедия',
  icecat: 'Open Icecat',
  store: 'карточка магазина',
};

const date = (iso: string) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('ru-RU', { timeZone: 'UTC' }) : '');

/** Link to a prefilled GitHub issue: no backend needed */
export function reportUrl(product: Product): string {
  const page = new URL(productHref(product), siteConfig.url).toString();
  const title = `Ошибка в данных: ${product.brand} ${product.name}`;
  const body = `Страница: ${page}\n\nЧто не так:\n\nКак правильно и где это указано (ссылка на сайт производителя):\n`;
  return `${siteConfig.repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

export function ModelHero({ product }: { product: Product }) {
  const config = categoryById[product.category];
  const meta = [...config.meta(product), product.category === 'cpu' ? String(product.specs.arch ?? '') : '']
    .filter(Boolean)
    .join(' · ');
  const updated = date(product.updatedAt ?? catalogDate);

  return (
    <section className="card model-hero" aria-labelledby="model-title">
      <div className="model-hero__image">
        <Thumb product={product} width={200} height={150} draw spin className="model-hero__thumb" />
      </div>
      <div className="model-hero__main">
        <p className="model-hero__meta">{meta}</p>
        <h1 id="model-title" className="model-hero__title">
          {product.brand} {product.name}
        </h1>
        <div className="model-hero__stats">
          {getStats(product, config.keySpecs).map((s) => (
            <Stat key={s.label} item={s} monoValue />
          ))}
        </div>
        <div className="model-hero__actions">
          {inBuild(product.category) && (
            <Link href={`/build?add=${product.category}/${product.slug}`} className="btn btn--accent">
              <Wrench size={16} aria-hidden="true" />
              Добавить в конструктор
            </Link>
          )}
          <CompareButton product={product} />
        </div>
        <p className="provenance">
          {product.source ? `Источник: ${sourceLabel[product.source]}. ` : ''}
          {updated ? `Обновлено ${updated}.` : ''}{' '}
          <a href={reportUrl(product)} target="_blank" rel="noopener noreferrer" className="provenance__report">
            <Flag size={12} aria-hidden="true" />
            Сообщить об ошибке
          </a>
        </p>
      </div>
    </section>
  );
}

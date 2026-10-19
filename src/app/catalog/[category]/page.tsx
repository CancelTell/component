import type { Metadata } from 'next';
import { toJsonLd } from '@/lib/json-ld';
import { notFound } from 'next/navigation';
import { categories, categoryById, categoryPayload, isCategoryId } from '@/data';
import { productHref } from '@/lib/catalog';
import { siteConfig } from '@/lib/site';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CatalogView } from '@/components/catalog/CatalogView';
import { ComparisonBar } from '@/components/catalog/ComparisonBar';

type Params = Promise<{ category: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  if (!isCategoryId(category)) return {};
  const config = categoryById[category];
  return {
    title: `${config.name}: характеристики и совместимость`,
    description: `${config.description} Таблица с сортировкой, фильтры и проверка совместимости в конструкторе.`,
    alternates: { canonical: `/catalog/${category}` },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { category } = await params;
  if (!isCategoryId(category)) notFound();
  const config = categoryById[category];
  const payload = categoryPayload(category);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: config.name,
    numberOfItems: payload.products.length,
    itemListElement: payload.products.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: new URL(productHref(p), siteConfig.url).toString(),
      name: `${p.brand} ${p.name}`,
    })),
  };

  return (
    <>
      <div className="container page page--wide">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
        <Breadcrumbs items={[{ label: 'Комплектующие', href: '/catalog' }, { label: config.name }]} />
        <div className="page__head">
          <h1 className="title-1">{config.name}</h1>
        </div>
        <CatalogView category={category} payload={payload} />
      </div>
      <ComparisonBar category={category} />
    </>
  );
}

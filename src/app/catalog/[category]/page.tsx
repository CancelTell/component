import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories, categoryById, getProductsByCategory, isCategoryId } from '@/data';
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
    title: config.name,
    description: config.description,
    alternates: { canonical: `/catalog/${category}` },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { category } = await params;
  if (!isCategoryId(category)) notFound();
  const config = categoryById[category];

  return (
    <>
      <div className="container page">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: config.name }]} />
        <div className="page__head">
          <h1 className="title-1">{config.name}</h1>
        </div>
        <CatalogView category={category} products={getProductsByCategory(category)} />
      </div>
      <ComparisonBar category={category} />
    </>
  );
}

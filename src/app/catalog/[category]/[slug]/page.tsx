import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categoryById, getProduct, products } from '@/data';
import { productHref, productMeta, productSummary } from '@/lib/catalog';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ModelHero } from '@/components/product/ModelHero';
import { SpecTable } from '@/components/product/SpecTable';
import { ModelAside } from '@/components/product/ModelAside';

type Params = Promise<{ category: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ category: p.category, slug: p.slug }));
}

async function load(params: Params) {
  const { category, slug } = await params;
  const product = getProduct(slug);
  return product && product.category === category ? product : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await load(params);
  if (!product) return {};
  const title = `${product.brand} ${product.name}`;
  const description = `${categoryById[product.category].singular} ${title}: ${productMeta(product)}, ${productSummary(product)}. Характеристики, совместимость и похожие модели.`;
  return {
    title,
    description,
    alternates: { canonical: productHref(product) },
    openGraph: { title, description },
  };
}

export default async function ModelPage({ params }: { params: Params }) {
  const product = await load(params);
  if (!product) notFound();
  const config = categoryById[product.category];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    brand: { '@type': 'Brand', name: product.brand },
    category: config.singular,
  };

  return (
    <div className="container page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        items={[
          { label: 'Главная', href: '/' },
          { label: config.name, href: `/catalog/${config.id}` },
          { label: product.name },
        ]}
      />
      <ModelHero product={product} />
      <div className="model-body">
        <SpecTable product={product} />
        <ModelAside product={product} />
      </div>
    </div>
  );
}

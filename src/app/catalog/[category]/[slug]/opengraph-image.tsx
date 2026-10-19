import { categoryById, getProduct } from '@/data';
import { productSummary } from '@/lib/catalog';
import { ogContentType, ogImage, ogSize } from '@/lib/og';

export const alt = 'Модель: характеристики и совместимость';
export const size = ogSize;
export const contentType = ogContentType;

type Params = { category: string; slug: string };

export default async function Image({ params }: { params: Promise<Params> | Params }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return ogImage({ kicker: 'Комплектующие', title: 'Модель не найдена', lines: [] });
  const config = categoryById[product.category];
  return ogImage({ kicker: `${config.singular} · ${product.brand}`, title: product.name, lines: [productSummary(product)] });
}

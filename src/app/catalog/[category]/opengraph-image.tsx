import { categoryById, countByCategory, isCategoryId } from '@/data';
import { modelsLabel } from '@/lib/format';
import { ogContentType, ogImage, ogSize } from '@/lib/og';

export const alt = 'Категория комплектующих';
export const size = ogSize;
export const contentType = ogContentType;

type Params = { category: string };

export default async function Image({ params }: { params: Promise<Params> | Params }) {
  const { category } = await params;
  if (!isCategoryId(category)) return ogImage({ kicker: 'Комплектующие', title: 'Каталог', lines: [] });
  const config = categoryById[category];
  return ogImage({ kicker: 'Комплектующие', title: config.name, lines: [modelsLabel(countByCategory(category)), config.tagline] });
}

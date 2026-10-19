import { products } from '@/data';
import { modelsLabel } from '@/lib/format';
import { ogContentType, ogImage, ogSize } from '@/lib/og';

export const alt = 'COMPONENT — конструктор ПК с проверкой совместимости';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ kicker: 'Конструктор ПК', title: 'Соберите ПК без ошибок совместимости', lines: [`${modelsLabel(products.length)} в каталоге`] });
}

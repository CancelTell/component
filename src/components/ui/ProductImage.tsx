import type { Product } from '@/data/types';
import { categoryById } from '@/data/categories';
import { CategoryIcon } from './CategoryIcon';

/**
 * Product photo when the data has one (Icecat), otherwise a quiet category icon.
 * Plain <img> on purpose: photos come from images.icecat.biz already sized, and the site
 * stays deployable to any host without an image optimisation server.
 */
export function ProductImage({ product, size = 160, className = '' }: { product: Product; size?: number; className?: string }) {
  const config = categoryById[product.category];
  if (product.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={`pimg ${className}`}
        src={product.image}
        alt={`${product.brand} ${product.name}`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span className={`pimg pimg--empty ${className}`} role="img" aria-label={`${config.singular}: фото нет`} style={{ width: size, height: size }}>
      <CategoryIcon name={config.icon} size={Math.round(size * 0.38)} strokeWidth={1.25} />
    </span>
  );
}

import type { CSSProperties } from 'react';
import type { IconName, Product } from '@/data/types';
import { categoryById } from '@/data/categories';
import { ComponentArt, artStyle } from './ComponentArt';

interface Props {
  /** Shows the product photo when it has one, otherwise the category art */
  product?: Product;
  icon?: IconName;
  width: number;
  height: number;
  /** Draw the lines once on mount; spin the fans */
  draw?: boolean;
  spin?: boolean;
  className?: string;
}

/** Small picture of a part: real photo (Icecat) or the animated category illustration on its gradient */
export function Thumb({ product, icon, width, height, draw = false, spin = false, className = '' }: Props) {
  const name = icon ?? (product ? categoryById[product.category].icon : 'case');
  const size = { width, height } as CSSProperties;
  if (product?.image) {
    return (
      <span className={`thumb thumb--photo ${className}`} style={size}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pimg" src={product.image} alt="" width={width} height={height} loading="lazy" decoding="async" />
      </span>
    );
  }
  return (
    <span className={`thumb ${className}`} style={{ ...size, ...artStyle(name) }} aria-hidden="true">
      <ComponentArt name={name} className={`${draw ? 'art--draw' : ''} ${spin ? 'art--spin' : ''}`} />
    </span>
  );
}

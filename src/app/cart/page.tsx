import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CartView } from '@/components/cart/CartView';

export const metadata: Metadata = {
  title: 'Корзина сборок',
  description: 'Сохранённые сборки ПК: цены в DNS, Ozon, Ситилинке и М.Видео, где дешевле купить комплект целиком или по частям.',
  alternates: { canonical: '/cart' },
  // Personal page: content lives in the visitor's browser
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Корзина' }]} />
      <div className="page__head">
        <h1 className="title-1">Корзина сборок</h1>
        <p className="page__lead">Сохранённые комплекты и цены по магазинам: где дешевле взять всё сразу, а где по частям.</p>
      </div>
      <CartView />
    </div>
  );
}

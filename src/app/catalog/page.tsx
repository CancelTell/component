import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CategoryGrid } from '@/components/home/CategoryGrid';

export const metadata: Metadata = {
  title: 'Все категории',
  description: 'Все категории справочника: процессоры, видеокарты, материнские платы, память, накопители, блоки питания, охлаждение и корпуса.',
  alternates: { canonical: '/catalog' },
};

export default function CatalogIndexPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Все категории' }]} />
      <div className="page__head">
        <h1 className="title-1">Все категории</h1>
        <p className="page__lead">Выберите категорию, чтобы посмотреть модели, отфильтровать и сравнить их.</p>
      </div>
      <CategoryGrid />
    </div>
  );
}

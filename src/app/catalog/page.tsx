import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FolderGrid } from '@/components/home/FolderGrid';

export const metadata: Metadata = {
  title: 'Комплектующие для ПК',
  description: 'Процессоры, видеокарты, материнские платы, память, накопители, блоки питания, охлаждение и корпуса: таблицы характеристик с фильтрами и сортировкой.',
  alternates: { canonical: '/catalog' },
};

export default function CatalogIndexPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Комплектующие' }]} />
      <div className="page__head">
        <h1 className="title-1">Комплектующие</h1>
        <p className="page__lead">Таблицы характеристик с фильтрами и сортировкой. Любую модель можно сразу отправить в конструктор.</p>
      </div>
      <FolderGrid />
    </div>
  );
}

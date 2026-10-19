import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BuildView } from '@/components/build/BuildView';

export const metadata: Metadata = {
  title: 'Конструктор ПК с проверкой совместимости',
  description:
    'Соберите компьютер по деталям: конструктор проверит сокет, память, BIOS, размеры корпуса, кулер и мощность блока питания и объяснит каждый результат.',
  alternates: { canonical: '/build' },
};

export default function BuildPage() {
  return (
    <div className="container page page--wide">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Конструктор' }]} />
      <div className="page__head">
        <h1 className="title-1">Конструктор</h1>
        <p className="page__lead">Выбирайте детали по порядку. Каждая проверка совместимости объясняет свой результат.</p>
      </div>
      <Suspense>
        <BuildView />
      </Suspense>
    </div>
  );
}

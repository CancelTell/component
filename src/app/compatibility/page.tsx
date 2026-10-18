import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CompatBuilder } from '@/components/compat/CompatBuilder';
import { BuildStarter } from '@/components/compat/BuildStarter';

export const metadata: Metadata = {
  title: 'Проверка сочетаемости',
  description: 'Выберите процессор, плату, память, видеокарту, блок питания и корпус — справочник проверит, подходят ли они друг другу.',
  alternates: { canonical: '/compatibility' },
};

export default function CompatibilityPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Сочетаемость' }]} />
      <div className="page__head">
        <h1 className="title-1">Проверка сочетаемости</h1>
        <p className="page__lead">Возьмите готовую сборку или подберите под бюджет, затем меняйте детали: справочник проверит, что всё подходит.</p>
      </div>
      <BuildStarter />
      <Suspense>
        <CompatBuilder />
      </Suspense>
    </div>
  );
}

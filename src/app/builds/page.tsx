import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BuildsView } from '@/components/builds/BuildsView';

export const metadata: Metadata = {
  title: 'Мои сборки',
  description: 'Сохранённые сборки ПК: состав, проверка совместимости и ссылка, чтобы поделиться.',
  alternates: { canonical: '/builds' },
  // Personal page: content lives in the visitor's browser
  robots: { index: false, follow: true },
};

export default function BuildsPage() {
  return (
    <div className="container page page--wide">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Мои сборки' }]} />
      <div className="page__head">
        <h1 className="title-1">Мои сборки</h1>
        <p className="page__lead">Сборки, сохранённые в конструкторе. Хранятся в этом браузере.</p>
      </div>
      <BuildsView />
    </div>
  );
}

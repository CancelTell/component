import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CompareView } from '@/components/compare/CompareView';

export const metadata: Metadata = {
  title: 'Сравнение',
  description: 'Сравните до четырёх моделей одной категории: различия подсвечены, лучшие значения выделены.',
  alternates: { canonical: '/compare' },
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return (
    <div className="container page">
      <Suspense>
        <CompareView />
      </Suspense>
    </div>
  );
}

import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { GuideView } from '@/components/guide/GuideView';
import { guideSteps } from '@/components/guide/steps';

export const metadata: Metadata = {
  title: 'Как собрать компьютер: пошаговая инструкция',
  description:
    'Сборка ПК своими руками по шагам с анимацией: процессор, память, кулер, накопитель M.2, плата, блок питания, видеокарта и первое включение.',
  alternates: { canonical: '/guide' },
};

export default function GuidePage() {
  // Plain text version of every step for search engines and screen readers
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Как собрать компьютер',
    totalTime: 'PT2H',
    tool: [{ '@type': 'HowToTool', name: 'Крестовая отвёртка PH2' }],
    step: guideSteps.map((s) => ({
      '@type': 'HowToStep',
      name: s.title,
      itemListElement: s.phases.map((p) => ({ '@type': 'HowToDirection', text: p.text })),
    })),
  };

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Инструкция по сборке' }]} />
      <div className="page__head guide-head">
        <h1 className="title-1">Как собрать компьютер</h1>
        <p className="page__lead">
          {guideSteps.length} шагов, от подготовки стола до первого включения. Анимация показывает, что делать руками, а список рядом подсвечивает текущее действие.
        </p>
        <ul className="guide-facts" role="list">
          <li>1,5–2 часа</li>
          <li>крестовая отвёртка PH2</li>
          <li>справится новичок</li>
        </ul>
      </div>
      <GuideView />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
    </div>
  );
}

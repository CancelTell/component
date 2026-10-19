import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'О проекте',
  description: 'COMPONENT — независимый справочник компьютерных комплектующих с проверкой совместимости.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'О проекте' }]} />
      <div className="page__head">
        <h1 className="title-1">О проекте</h1>
      </div>
      <div className="prose">
        <p>
          COMPONENT помогает собрать компьютер без ошибок совместимости. Главный инструмент —{' '}
          <Link className="link" href="/build">конструктор</Link>: он проверяет сокет и BIOS, поколение памяти, мощность и
          разъёмы блока питания, крепление и высоту кулера, размеры корпуса и слоты M.2 и объясняет каждый результат.
        </p>
        <p>
          <Link className="link" href="/catalog">Каталог</Link> — таблицы характеристик с фильтрами и сортировкой. Модели
          одной категории можно <Link className="link" href="/compare">сравнить</Link> по четыре.
        </p>
        <h2 className="title-2">Откуда данные</h2>
        <p>
          Процессоры и видеокарты — из таблиц Википедии (CC BY-SA), остальные комплектующие — из открытой базы Open
          Icecat, часть моделей заполнена вручную по сайтам производителей. Каталог обновляется автоматически каждую ночь;
          у каждой модели указаны источник и дата обновления. Если значения нет в источнике, на сайте стоит прочерк, а
          проверка совместимости честно пишет «не проверено».
        </p>
        <p>
          У партнёрских версий видеокарт, кулеров и плат параметры отличаются: перед покупкой сверяйте длину, высоту и
          ревизию с карточкой в магазине.
        </p>
        <h2 id="contacts" className="title-2">
          Ошибки и предложения
        </h2>
        <p>
          На странице каждой модели есть ссылка «Сообщить об ошибке» — она открывает готовую форму на{' '}
          <a className="link" href={siteConfig.repo + '/issues'} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}

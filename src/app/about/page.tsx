import type { Metadata } from 'next';
import Link from 'next/link';
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
          COMPONENT — справочник компьютерных комплектующих. Здесь собраны характеристики процессоров, видеокарт,
          материнских плат и других компонентов в одном формате, чтобы модели было удобно сравнивать.
        </p>
        <p>
          Модели можно <Link className="link" href="/compare">сравнить</Link> по четыре в одной таблице, а{' '}
          <Link className="link" href="/compatibility">проверка сочетаемости</Link> подскажет, подходят ли выбранные
          комплектующие друг к другу: сокет, тип памяти, мощность блока питания и размеры корпуса.
        </p>
        <p>
          Характеристики приведены по данным производителей. Перед покупкой уточняйте детали у продавца: у разных
          ревизий и партнёрских версий параметры могут отличаться.
        </p>
        <h2 id="contacts" className="title-2">
          Контакты
        </h2>
        <p>Раздел контактов появится позже. Предложения по справочнику и сообщения об ошибках в данных мы будем рады получить.</p>
      </div>
    </div>
  );
}

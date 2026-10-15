import Link from 'next/link';

const features = [
  {
    href: '/catalog/cpu',
    title: 'Поиск по характеристикам',
    text: 'Фильтры по сокету, типу памяти, бренду и ценовому сегменту.',
  },
  {
    href: '/compare',
    title: 'Сравнение до 4 моделей',
    text: 'Различия в характеристиках собраны в одной таблице.',
  },
  {
    href: '/compatibility',
    title: 'Проверка совместимости',
    text: 'Выберите процессор, плату и память, и справочник покажет, что с чем работает.',
  },
];

export function Features() {
  return (
    <ul className="feature-grid" role="list">
      {features.map((f, i) => (
        <li key={f.href}>
          <Link href={f.href} className="card feature">
            <span className="feature__num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="feature__title">{f.title}</h3>
            <p className="feature__text">{f.text}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

import Link from 'next/link';

const links = [
  { href: '/build', label: 'Конструктор' },
  { href: '/catalog', label: 'Комплектующие' },
  { href: '/builds', label: 'Мои сборки' },
  { href: '/guide', label: 'Инструкция' },
  { href: '/compare', label: 'Сравнение' },
  { href: '/about', label: 'О проекте' },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Link href="/" className="footer__brand">
          COMPONENT
        </Link>
        <nav aria-label="Ссылки в подвале">
          <ul className="footer__links" role="list">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="footer__note">
          Характеристики приведены по данным производителей, а также{' '}
          <a href="https://en.wikipedia.org/" target="_blank" rel="noopener noreferrer">
            Википедии
          </a>{' '}
          (CC BY-SA) и{' '}
          <a href="https://icecat.biz/" target="_blank" rel="noopener noreferrer">
            Open Icecat
          </a>
          , и носят справочный характер. Нашли неточность — нажмите «Сообщить об ошибке» на странице модели.
        </p>
      </div>
    </footer>
  );
}

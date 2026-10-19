export const siteConfig = {
  name: 'COMPONENT',
  description:
    'Соберите ПК без ошибок совместимости: конструктор проверяет сокет, память, BIOS, размеры корпуса, кулер и блок питания. Каталог процессоров, видеокарт, плат и памяти с таблицами и фильтрами.',
  /** Where «Сообщить об ошибке» opens a prefilled issue */
  repo: 'https://github.com/CancelTell/component',
  /** Set NEXT_PUBLIC_SITE_URL in production so canonical URLs, sitemap and OG links are absolute */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

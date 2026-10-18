export const siteConfig = {
  name: 'COMPONENT',
  description:
    'Справочник компьютерных комплектующих: характеристики процессоров, видеокарт, плат и памяти, сравнение до четырёх моделей и проверка совместимости.',
  /** Set NEXT_PUBLIC_SITE_URL in production so canonical URLs, sitemap and OG links are absolute */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

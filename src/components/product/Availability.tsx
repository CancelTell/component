import { ExternalLink, Store } from 'lucide-react';
import { OFFERS_ARE_DEMO, getOffers } from '@/data/offers';
import { rub } from '@/lib/pricing';


/** "Где купить": store offers for a model, or an honest empty state while there is no data */
export function Availability({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const offers = getOffers(slug);
  const inStock = offers.filter((o) => o.inStock);
  const minPrice = inStock.reduce<number | null>((min, o) => (o.price !== null && (min === null || o.price < min) ? o.price : min), null);

  return (
    <section className={`card avail${compact ? ' avail--compact' : ''}`} aria-labelledby={`avail-${slug}`}>
      <div className="avail__head">
        <span className="avail__icon" aria-hidden="true">
          <Store size={18} />
        </span>
        <div>
          <h2 id={`avail-${slug}`} className="avail__title">
            Наличие в магазинах
            {OFFERS_ARE_DEMO && offers.length > 0 && <span className="demo-badge">демо</span>}
          </h2>
          <p className="avail__sub">
            {offers.length === 0
              ? 'Цены и наличие появятся, когда подключим магазины'
              : inStock.length > 0
                ? `В наличии в ${inStock.length} из ${offers.length}${minPrice !== null ? `, от ${rub(minPrice)}` : ''}`
                : 'Сейчас нет в наличии'}
          </p>
        </div>
      </div>

      {offers.length > 0 && (
        <ul className="avail__list" role="list">
          {offers.map((o) => (
            <li key={o.storeId} className="avail__row">
              <span className="avail__store">{o.store}</span>
              <span className={`avail__state${o.inStock ? ' is-in' : ''}`}>{o.inStock ? 'в наличии' : 'нет'}</span>
              <span className="avail__price">{o.price !== null ? rub(o.price) : '—'}</span>
              <a className="avail__link" href={o.url} target="_blank" rel="noopener noreferrer" aria-label={`Открыть в магазине ${o.store}`}>
                <ExternalLink size={16} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

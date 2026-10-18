'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { Box, Check, Copy, PencilLine, Plus, Share2, Trash2, X } from 'lucide-react';
import { categoryById } from '@/data';
import { OFFERS_ARE_DEMO } from '@/data/offers';
import { stores } from '@/data/stores';
import { productHref } from '@/lib/catalog';
import { useBuild } from '@/lib/build-store';
import { buildProducts, resolveBuild, useCart, type SavedBuild } from '@/lib/cart-store';
import { buildSlots, estimatePower, runChecks } from '@/lib/compatibility';
import { pluralize } from '@/lib/format';
import { shareBuild } from '@/lib/share';
import { useToast } from '@/components/ui/Toast';
import { priceBuild, rub } from '@/lib/pricing';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';

const positions = (n: number) => `${n} ${pluralize(n, ['позиция', 'позиции', 'позиций'])}`;
const inStores = (n: number) => `${n} ${pluralize(n, ['магазине', 'магазинах', 'магазинах'])}`;

export function CartView() {
  const cart = useCart();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = cart.builds.find((b) => b.id === activeId) ?? cart.builds[cart.builds.length - 1] ?? null;

  if (!active) {
    return (
      <section className="card cart-empty">
        <span className="cart-empty__art" style={artStyle('case')} aria-hidden="true">
          <ComponentArt name="case" className="art--draw art--spin" />
        </span>
        <h2 className="cart-empty__title">Сборок пока нет</h2>
        <p className="cart-empty__text">
          Соберите комплект на странице сочетаемости и нажмите «В корзину». Здесь появятся цены по магазинам и итог.
        </p>
        <Link href="/compatibility" className="btn btn--accent btn--lg">
          Собрать комплект
        </Link>
      </section>
    );
  }

  return (
    <div className="cart">
      <div className="cart__tabs" role="tablist" aria-label="Сборки">
        {cart.builds.map((b) => {
          const total = priceBuild(buildProducts(b.slots)).split.total;
          return (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={b.id === active.id}
              className="cart__tab"
              onClick={() => setActiveId(b.id)}
            >
              <span className="cart__tab-name">{b.name}</span>
              <span className="cart__tab-price">{total > 0 ? rub(total) : '—'}</span>
            </button>
          );
        })}
        <Link href="/compatibility" className="cart__tab cart__tab--new">
          <Plus size={16} aria-hidden="true" />
          Новая
        </Link>
      </div>
      <BuildDetail key={active.id} saved={active} onRemoved={() => setActiveId(null)} />
    </div>
  );
}

function BuildDetail({ saved, onRemoved }: { saved: SavedBuild; onRemoved: () => void }) {
  const cart = useCart();
  const { load } = useBuild();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();

  const build = resolveBuild(saved.slots);
  const products = buildSlots.flatMap((s) => (build[s] ? [build[s]!] : []));
  const price = priceBuild(products);
  const checks = runChecks(build);
  const fail = checks.find((c) => c.status === 'fail');
  const warn = checks.find((c) => c.status === 'warn');
  const pending = checks.filter((c) => c.status === 'pending').length;
  const maxTotal = Math.max(1, ...price.byStore.map((s) => s.total));

  const edit = () => {
    load(saved.slots);
    router.push('/compatibility');
  };

  return (
    <div className="cart__grid">
      <section className="card cart-items" aria-labelledby="cart-name">
        <div className="cart-items__head">
          <input
            id="cart-name"
            className="cart__name"
            value={saved.name}
            onChange={(e) => cart.update(saved.id, { name: e.target.value })}
            aria-label="Название сборки"
            maxLength={60}
          />
          <PencilLine size={16} className="cart__name-icon" aria-hidden="true" />
        </div>

        <div className="ptable" role="table" aria-label="Цены по магазинам">
          <div className="ptable__row ptable__row--head" role="row">
            <span role="columnheader">Комплектующее</span>
            {stores.map((s) => (
              <span key={s.id} role="columnheader" className="ptable__store" style={{ ['--s' as string]: s.color } as CSSProperties}>
                {s.name}
              </span>
            ))}
          </div>

          {buildSlots.map((slot, i) => {
            const product = build[slot];
            const config = categoryById[slot];
            const item = price.items.find((x) => x.product.slug === product?.slug);
            return (
              <div
                key={slot}
                role="row"
                className={`ptable__row${product ? '' : ' ptable__row--empty'}`}
                style={{ ['--i' as string]: i } as CSSProperties}
              >
                <span role="cell" className="ptable__item">
                  <span className="ptable__icon" style={artStyle(config.icon)}>
                    <CategoryIcon name={config.icon} size={20} />
                  </span>
                  <span className="ptable__text">
                    <span className="ptable__slot">{config.singular}</span>
                    {product ? (
                      <Link href={productHref(product)} className="ptable__name">
                        {product.brand} {product.name}
                      </Link>
                    ) : (
                      <button type="button" className="ptable__add" onClick={edit}>
                        <Plus size={14} aria-hidden="true" /> Добавить
                      </button>
                    )}
                  </span>
                </span>
                {stores.map((s) => {
                  if (!product) return <span key={s.id} role="cell" className="ptable__cell" />;
                  const o = item?.offers.find((x) => x.storeId === s.id);
                  const isBest = !!o && item?.best === o;
                  return (
                    <span key={s.id} role="cell" className="ptable__cell" data-store={s.name}>
                      {o && o.inStock && o.price !== null ? (
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`ptable__price${isBest ? ' is-best' : ''}`}
                          aria-label={`${s.name}: ${rub(o.price)}${isBest ? ', дешевле всего' : ''}`}
                        >
                          {rub(o.price)}
                        </a>
                      ) : (
                        <span className="ptable__none">нет</span>
                      )}
                    </span>
                  );
                })}
              </div>
            );
          })}

          {products.length > 0 && (
            <div className="ptable__row ptable__row--total" role="row">
              <span role="cell" className="ptable__item">
                <span className="ptable__slot">Всё в одном магазине</span>
              </span>
              {stores.map((s) => {
                const t = price.byStore.find((x) => x.store.id === s.id)!;
                const best = price.bestSingle?.store.id === s.id;
                return (
                  <span key={s.id} role="cell" className="ptable__cell" data-store={s.name}>
                    {t.missing.length === 0 ? (
                      <b className={best ? 'is-best' : undefined}>{rub(t.total)}</b>
                    ) : (
                      <span className="ptable__none">нет {t.missing.length}</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <p className="cart__note">
          Зелёным отмечена самая низкая цена. Ссылка открывает поиск модели в магазине.
          {OFFERS_ARE_DEMO && ' Сейчас цены демонстрационные, реальные появятся после подключения магазинов.'}
        </p>
      </section>

      <aside className="cart__aside">
        <section className="card cart-sum" aria-label="Итог">
          <p className="cart-sum__label">
            Если брать каждую деталь там, где дешевле
            {OFFERS_ARE_DEMO && <span className="demo-badge">демо</span>}
          </p>
          <p className="cart-sum__value">{products.length ? rub(price.split.total) : '—'}</p>
          <p className="cart-sum__sub">
            {price.split.missing.length > 0
              ? `Нигде нет в наличии: ${positions(price.split.missing.length)}`
              : products.length
                ? `${positions(products.length)} в ${inStores(price.split.storesUsed)}`
                : 'Добавьте комплектующие'}
          </p>

          {products.length > 0 && (
            <div className="cart-sum__single">
              <p className="cart-sum__label">Одним заказом</p>
              {price.bestSingle ? (
                <p className="cart-sum__single-row">
                  <b>{price.bestSingle.store.name}</b>
                  <span>{rub(price.bestSingle.total)}</span>
                  {price.savings !== null && price.savings > 0 && (
                    <span className="cart-sum__diff">+{rub(price.savings)}</span>
                  )}
                </p>
              ) : (
                <p className="cart-sum__sub">Ни в одном магазине нет всего списка сразу</p>
              )}
            </div>
          )}

          {products.length > 0 && (
            <ul className="store-bars" role="list" aria-label="Сумма по магазинам">
              {price.byStore.map((t, i) => (
                <li
                  key={t.store.id}
                  className={`store-bar${t.missing.length ? ' store-bar--partial' : ''}`}
                  style={{ ['--s' as string]: t.store.color, ['--w' as string]: `${(t.total / maxTotal) * 100}%`, ['--i' as string]: i } as CSSProperties}
                >
                  <span className="store-bar__name">{t.store.name}</span>
                  <span className="store-bar__track">
                    <span />
                  </span>
                  <span className="store-bar__value">
                    {t.missing.length ? `без ${t.missing.length}` : rub(t.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`card cart-compat cart-compat--${fail ? 'fail' : warn ? 'warn' : pending ? 'pending' : 'ok'}`}>
          <span className="cart-compat__icon" aria-hidden="true">
            {fail ? <X size={16} strokeWidth={3} /> : warn ? '!' : <Check size={16} strokeWidth={3} />}
          </span>
          <div>
            <p className="cart-compat__title">
              {fail ? 'Есть несовместимость' : warn ? 'Есть замечание' : pending ? 'Проверено не всё' : 'Всё совместимо'}
            </p>
            <p className="cart-compat__msg">
              {fail?.message ?? warn?.message ?? (pending ? `Проверено ${checks.length - pending} из ${checks.length}, добавьте остальные детали` : `Блок питания от ${estimatePower(build).recommended} Вт`)}
            </p>
          </div>
        </section>

        <div className="cart__actions">
          <button type="button" className="btn btn--accent" onClick={edit}>
            <PencilLine size={18} aria-hidden="true" /> Изменить
          </button>
          <button
            type="button"
            className="btn btn--outline"
            disabled={products.length === 0}
            onClick={async () => {
              const r = await shareBuild(saved.slots, saved.name);
              if (r === 'copied') toast.show('Ссылка на сборку скопирована');
              else if (r === 'failed') toast.show('Не получилось скопировать ссылку');
            }}
          >
            <Share2 size={18} aria-hidden="true" /> Поделиться
          </button>
          <button type="button" className="btn btn--outline" onClick={() => cart.duplicate(saved.id)}>
            <Copy size={18} aria-hidden="true" /> Копия
          </button>
          {confirming ? (
            <button
              type="button"
              className="btn btn--outline cart__delete is-confirm"
              onClick={() => {
                cart.remove(saved.id);
                onRemoved();
              }}
              onBlur={() => setConfirming(false)}
              autoFocus
            >
              Точно удалить?
            </button>
          ) : (
            <button type="button" className="btn btn--outline cart__delete" onClick={() => setConfirming(true)}>
              <Trash2 size={18} aria-hidden="true" /> Удалить
            </button>
          )}
        </div>

        {toast.node}

        <section className="card cart-3d" style={artStyle('case')}>
          <span className="cart-3d__art" aria-hidden="true">
            <ComponentArt name="case" />
          </span>
          <div>
            <p className="cart-3d__title">
              <Box size={16} aria-hidden="true" /> 3D-вид сборки
              <span className="demo-badge">скоро</span>
            </p>
            <p className="cart-3d__text">Покрутить корпус и посмотреть, как плата, кулер и видеокарта встают внутри.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}

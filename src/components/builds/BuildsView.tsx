'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { Copy, PencilLine, Plus, Share2, Trash2 } from 'lucide-react';
import { categoryById } from '@/data/categories';
import { stores } from '@/data/stores';
import { productHref, productSummary } from '@/lib/catalog';
import { useCatalog } from '@/lib/catalog-client';
import { categoriesOf, loadBuild, resolveBuild } from '@/lib/build-store';
import { useSavedBuilds, type SavedBuild } from '@/lib/saved-builds';
import { buildSlots, estimatePower, runChecks, slotCategory, slotLabel } from '@/lib/compatibility';
import { pluralize } from '@/lib/format';
import { shareBuild } from '@/lib/share';
import { HAS_PRICES, priceBuild, rub } from '@/lib/pricing';
import { useToast } from '@/components/ui/Toast';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Thumb } from '@/components/ui/Thumb';
import { CheckList, StatusIcon, verdict } from '@/components/build/CheckList';

const positions = (n: number) => `${n} ${pluralize(n, ['позиция', 'позиции', 'позиций'])}`;
const inStores = (n: number) => `${n} ${pluralize(n, ['магазине', 'магазинах', 'магазинах'])}`;

/** «Мои сборки»: builds saved in this browser, their checks and (with store feeds) prices per store */
export function BuildsView() {
  const saved = useSavedBuilds();
  const [activeId, setActiveId] = useState<string | null>(null);
  const ready = useCatalog(saved.builds.flatMap((b) => categoriesOf(b.slots)));
  const active = saved.builds.find((b) => b.id === activeId) ?? saved.builds[saved.builds.length - 1] ?? null;

  if (!active) {
    return (
      <section className="card empty-card">
        <h2 className="title-3">Сохранённых сборок пока нет</h2>
        <p className="empty-card__text">
          Соберите компьютер в конструкторе и нажмите «Сохранить сборку». Сборки хранятся в этом браузере; ссылкой можно поделиться.
        </p>
        <Link href="/build" className="btn btn--accent">
          Открыть конструктор
        </Link>
      </section>
    );
  }

  return (
    <div className="builds">
      <div className="builds__tabs" role="tablist" aria-label="Сборки">
        {saved.builds.map((b) => {
          const v = ready ? verdict(runChecks(resolveBuild(b.slots))) : null;
          return (
            <button key={b.id} type="button" role="tab" aria-selected={b.id === active.id} className="builds__tab" onClick={() => setActiveId(b.id)}>
              {v && <StatusIcon status={v.status} size={12} />}
              <span className="builds__tab-name">{b.name}</span>
            </button>
          );
        })}
        <Link href="/build" className="builds__tab builds__tab--new">
          <Plus size={16} aria-hidden="true" />
          Новая
        </Link>
      </div>
      {ready ? <BuildDetail key={active.id} saved={active} onRemoved={() => setActiveId(null)} /> : <p className="text-muted">Загружаем детали…</p>}
    </div>
  );
}

function BuildDetail({ saved, onRemoved }: { saved: SavedBuild; onRemoved: () => void }) {
  const builds = useSavedBuilds();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();

  const build = resolveBuild(saved.slots);
  const products = buildSlots.flatMap((s) => (build[s] ? [build[s]!] : []));
  const price = priceBuild(products);
  const checks = runChecks(build);
  const v = verdict(checks);
  const power = estimatePower(build);

  const edit = () => {
    loadBuild(saved.slots);
    router.push('/build');
  };

  return (
    <div className="builds__grid">
      <section className="card builds__parts" aria-labelledby="build-name">
        <div className="builds__head">
          <input
            id="build-name"
            className="builds__name"
            value={saved.name}
            onChange={(e) => builds.update(saved.id, { name: e.target.value })}
            aria-label="Название сборки"
            maxLength={60}
          />
          <PencilLine size={16} className="builds__name-icon" aria-hidden="true" />
        </div>

        <div className="ptable" role="table" aria-label={HAS_PRICES ? 'Цены по магазинам' : 'Детали сборки'} style={{ ['--stores' as string]: HAS_PRICES ? stores.length : 0 } as CSSProperties}>
          {HAS_PRICES && (
            <div className="ptable__row ptable__row--head" role="row">
              <span role="columnheader">Деталь</span>
              {stores.map((s) => (
                <span key={s.id} role="columnheader" className="ptable__store">
                  {s.name}
                </span>
              ))}
            </div>
          )}
          {buildSlots.map((slot) => {
            const product = build[slot];
            const config = categoryById[slotCategory(slot)];
            if (!product && slot === 'storage2') return null;
            const item = price.items.find((x) => x.product.slug === product?.slug);
            return (
              <div key={slot} role="row" className={`ptable__row${product ? '' : ' ptable__row--empty'}`}>
                <span role="cell" className="ptable__item">
                  {product ? (
                    <Thumb product={product} width={44} height={32} />
                  ) : (
                    <span className="ptable__icon">
                      <CategoryIcon name={config.icon} size={18} />
                    </span>
                  )}
                  <span className="ptable__text">
                    <span className="ptable__slot">{slotLabel(slot, config.singular)}</span>
                    {product ? (
                      <>
                        <Link href={productHref(product)} className="ptable__name">
                          {product.brand} {product.name}
                        </Link>
                        <span className="ptable__sub">{productSummary(product)}</span>
                      </>
                    ) : (
                      <button type="button" className="link-btn" onClick={edit}>
                        Добавить в конструкторе
                      </button>
                    )}
                  </span>
                </span>
                {HAS_PRICES &&
                  stores.map((s) => {
                    if (!product) return <span key={s.id} role="cell" className="ptable__cell" />;
                    const o = item?.offers.find((x) => x.storeId === s.id);
                    const isBest = !!o && item?.best === o;
                    return (
                      <span key={s.id} role="cell" className="ptable__cell" data-store={s.name}>
                        {o && o.inStock && o.price !== null ? (
                          <a href={o.url} target="_blank" rel="noopener noreferrer" className={`ptable__price${isBest ? ' is-best' : ''}`}>
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
        </div>
        {HAS_PRICES ? (
          <p className="note">Зелёным — самая низкая цена. Цены обновляются несколько раз в день, проверяйте их в магазине.</p>
        ) : (
          <p className="note">Цены по магазинам появятся здесь после подключения магазинов.</p>
        )}
      </section>

      <aside className="builds__aside">
        {HAS_PRICES && products.length > 0 && (
          <section className="card builds-sum" aria-label="Итог">
            <p className="builds-sum__label">Каждую деталь там, где дешевле</p>
            <p className="builds-sum__value num">{rub(price.split.total)}</p>
            <p className="builds-sum__sub">
              {price.split.missing.length > 0
                ? `Нигде нет в наличии: ${positions(price.split.missing.length)}`
                : `${positions(products.length)} в ${inStores(price.split.storesUsed)}`}
            </p>
            <p className="builds-sum__label">Одним заказом</p>
            <p className="builds-sum__sub">
              {price.bestSingle
                ? `${price.bestSingle.store.name}: ${rub(price.bestSingle.total)}${price.savings ? ` (+${rub(price.savings)})` : ''}`
                : 'Ни в одном магазине нет всего списка сразу'}
            </p>
          </section>
        )}

        <section className={`card verdict verdict--${v.status}`}>
          <div className="verdict__head">
            <StatusIcon status={v.status} size={16} />
            <div>
              <h2 className="verdict__title">{v.title}</h2>
              <p className="verdict__sub">{build.cpu || build.gpu ? `Потребление ~${power.draw} Вт, блок питания от ${power.recommended} Вт` : 'Добавьте процессор и видеокарту, чтобы оценить мощность'}</p>
            </div>
          </div>
          <CheckList checks={checks} hidePending />
        </section>

        <div className="builds__actions">
          <button type="button" className="btn btn--accent" onClick={edit}>
            <PencilLine size={16} aria-hidden="true" /> Изменить в конструкторе
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
            <Share2 size={16} aria-hidden="true" /> Ссылка
          </button>
          <button type="button" className="btn btn--outline" onClick={() => builds.duplicate(saved.id)}>
            <Copy size={16} aria-hidden="true" /> Копия
          </button>
          {confirming ? (
            <button
              type="button"
              className="btn btn--outline btn--danger"
              onClick={() => {
                builds.remove(saved.id);
                onRemoved();
              }}
              onBlur={() => setConfirming(false)}
              autoFocus
            >
              Точно удалить?
            </button>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={() => setConfirming(true)}>
              <Trash2 size={16} aria-hidden="true" /> Удалить
            </button>
          )}
        </div>
        {toast.node}
      </aside>
    </div>
  );
}

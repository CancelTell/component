'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Bookmark, Check, Plus, RotateCcw, Share2, X, Zap } from 'lucide-react';
import { categoryById } from '@/data/categories';
import type { Product } from '@/data/types';
import { productHref, productSummary } from '@/lib/catalog';
import { ensureCategories, getProduct } from '@/lib/catalog-client';
import { useBuild } from '@/lib/build-store';
import { suggestName, useSavedBuilds } from '@/lib/saved-builds';
import { parseShared, shareBuild } from '@/lib/share';
import { buildSlots, estimatePower, isSlot, runChecks, slotCategory, slotLabel, worst, type SlotId } from '@/lib/compatibility';
import { HAS_PRICES, priceBuild, rub } from '@/lib/pricing';
import { useToast } from '@/components/ui/Toast';
import { Thumb } from '@/components/ui/Thumb';
import { PriceLine } from '@/components/catalog/PriceLine';
import { CheckList, StatusIcon, verdict } from './CheckList';
import { PartPicker } from './PartPicker';
import { BuildStarter } from './BuildStarter';

/** Optional slots: the build is complete without them */
const OPTIONAL: SlotId[] = ['storage2'];

export function BuildView() {
  const params = useSearchParams();
  const addParam = params.get('add');
  const sharedParam = params.get('build');
  const { build, slugs, ready, select, clearSlot, reset, load } = useBuild();
  const saved = useSavedBuilds();
  const toast = useToast();
  const [picking, setPicking] = useState<SlotId | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // A model sent from its page: ?add=cpu/amd-ryzen-5-7600
  useEffect(() => {
    if (!addParam) return;
    const [raw, slug] = addParam.split('/');
    if (!raw || !slug || !isSlot(raw)) return;
    const category = slotCategory(raw);
    void ensureCategories([category]).then(() => {
      const product = getProduct(slug);
      if (!product || product.category !== category) return;
      // A second drive goes to the second drive slot
      const slot: SlotId = category === 'storage' && slugs.storage && slugs.storage !== slug ? 'storage2' : category;
      select(slot, product);
      toast.show(`${categoryById[product.category].singular} добавлен в сборку`);
    });
    window.history.replaceState(window.history.state, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addParam]);

  // A build shared by link (?build=cpu:slug,gpu:slug)
  useEffect(() => {
    const shared = parseShared(sharedParam);
    if (!shared) return;
    load(shared);
    toast.show('Открыта сборка по ссылке');
    window.history.replaceState(window.history.state, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedParam]);

  const checks = runChecks(build);
  const v = verdict(checks);
  const done = checks.filter((c) => c.status !== 'pending').length;
  const selected = buildSlots.flatMap((s) => (build[s] ? [build[s]!] : []));
  const power = estimatePower(build);
  const price = priceBuild(selected);
  const nextSlot = buildSlots.find((s) => !build[s] && !OPTIONAL.includes(s)) ?? null;
  const closePicker = useCallback(() => setPicking(null), []);
  const loadingShared = !ready && Object.keys(slugs).length > 0;

  const save = () => {
    const id = saved.add(slugs);
    setSavedId(id);
    toast.show('Сборка сохранена в «Мои сборки»');
  };
  const share = async () => {
    const result = await shareBuild(slugs, suggestName(slugs, 1));
    if (result === 'copied') toast.show('Ссылка на сборку скопирована');
    else if (result === 'failed') toast.show('Не получилось скопировать ссылку');
  };
  useEffect(() => setSavedId(null), [slugs]);

  const pick = (slot: SlotId, product: Product) => select(slot, product);

  return (
    <div className="builder">
      <BuildStarter />

      <div className="builder__grid">
        <section aria-label="Детали сборки">
          <ol className="slots" role="list">
            {buildSlots.map((slot, i) => {
              const config = categoryById[slotCategory(slot)];
              const product = build[slot];
              const own = product ? worst(checks.filter((c) => c.slots.includes(slot) && c.status !== 'pending')) : null;
              const label = slotLabel(slot, config.singular);
              if (slot === 'storage2' && !product && !build.storage) return null;
              return (
                <li key={slot} className={`slot${product ? ' slot--filled' : ''}${own ? ` slot--${own.status}` : ''}`}>
                  {product ? (
                    <Thumb key={product.slug} product={product} width={56} height={40} draw spin={slot === 'cooling' || slot === 'gpu'} className="slot__thumb" />
                  ) : (
                    <span className="slot__num" aria-hidden="true">
                      {i + 1}
                    </span>
                  )}
                  <div className="slot__text">
                    <span className="slot__label">
                      {label}
                      {OPTIONAL.includes(slot) && <span className="slot__opt">необязательно</span>}
                    </span>
                    {product ? (
                      <>
                        <Link href={productHref(product)} className="slot__value">
                          {product.brand} {product.name}
                        </Link>
                        <span className="slot__sub">{productSummary(product)}</span>
                        {own && own.status !== 'ok' && (
                          <span className={`slot__issue slot__issue--${own.status}`}>
                            <StatusIcon status={own.status} size={12} />
                            {own.message}
                          </span>
                        )}
                        <PriceLine slug={product.slug} className="slot__price" />
                      </>
                    ) : (
                      <span className="slot__value slot__value--empty">{loadingShared && slugs[slot] ? 'Загружаем…' : 'Не выбрано'}</span>
                    )}
                  </div>
                  <div className="slot__actions">
                    {product ? (
                      <>
                        <button type="button" className="btn btn--outline btn--sm" onClick={() => setPicking(slot)}>
                          Заменить
                        </button>
                        <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label={`Убрать: ${label}`} onClick={() => clearSlot(slot)}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button type="button" className={`btn btn--sm ${slot === nextSlot ? 'btn--accent' : 'btn--outline'}`} onClick={() => setPicking(slot)}>
                        <Plus size={16} aria-hidden="true" />
                        Выбрать
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="builder__aside" id="checks" aria-labelledby="verdict-title">
          <section className={`card verdict verdict--${v.status}`}>
            <div className="verdict__head">
              <StatusIcon status={v.status} size={16} />
              <div>
                <h2 id="verdict-title" className="verdict__title">
                  {v.title}
                </h2>
                <p className="verdict__sub">
                  Проверено {done} из {checks.length}
                </p>
              </div>
            </div>

            <dl className="verdict__facts">
              <div>
                <dt>
                  <Zap size={14} aria-hidden="true" /> Потребление
                </dt>
                <dd className="num">{build.cpu || build.gpu ? `~${power.draw} Вт` : '—'}</dd>
              </div>
              <div>
                <dt>Блок питания от</dt>
                <dd className="num">{build.cpu || build.gpu ? `${power.recommended} Вт` : '—'}</dd>
              </div>
              {HAS_PRICES && (
                <div>
                  <dt>Цена комплекта</dt>
                  <dd className="num">{selected.length && price.split.missing.length < selected.length ? `от ${rub(price.split.total)}` : '—'}</dd>
                </div>
              )}
            </dl>
            {(build.cpu || build.gpu) && (
              <details className="checks__more verdict__power">
                <summary>Как считается мощность</summary>
                <p>{power.details}</p>
              </details>
            )}

            <div className="verdict__actions">
              {savedId ? (
                <Link href="/builds" className="btn btn--primary">
                  <Check size={16} aria-hidden="true" /> Открыть «Мои сборки»
                </Link>
              ) : (
                <button type="button" className="btn btn--accent" disabled={selected.length === 0} onClick={save}>
                  <Bookmark size={16} aria-hidden="true" /> Сохранить сборку
                </button>
              )}
              <button type="button" className="btn btn--outline" disabled={selected.length === 0} onClick={share}>
                <Share2 size={16} aria-hidden="true" /> Ссылка
              </button>
              <button type="button" className="btn btn--ghost" disabled={selected.length === 0} onClick={reset}>
                <RotateCcw size={16} aria-hidden="true" /> Очистить
              </button>
            </div>

            <CheckList checks={checks} />

          </section>
        </aside>
      </div>

      {/* Phones: verdict and the next step always at hand */}
      <div className="builder-bar" role="region" aria-label="Итог сборки">
        <a href="#checks" className="builder-bar__status">
          <StatusIcon status={v.status} />
          <span>
            <b>{v.title}</b>
            <span className="builder-bar__sub">
              {done} из {checks.length} проверок{build.cpu || build.gpu ? ` · БП от ${power.recommended} Вт` : ''}
              {HAS_PRICES && selected.length ? ` · ${rub(price.split.total)}` : ''}
            </span>
          </span>
        </a>
        {nextSlot ? (
          <button type="button" className="btn btn--accent btn--sm" onClick={() => setPicking(nextSlot)}>
            {categoryById[slotCategory(nextSlot)].singular}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="btn btn--accent btn--sm" disabled={!!savedId} onClick={save}>
            <Bookmark size={16} aria-hidden="true" /> {savedId ? 'Сохранено' : 'Сохранить'}
          </button>
        )}
      </div>

      {toast.node}
      <PartPicker slot={picking} build={build} onPick={pick} onClose={closePicker} />
    </div>
  );
}

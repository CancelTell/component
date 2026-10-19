import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { getProduct } from '@/data';
import { presets } from '@/data/presets';
import type { IconName } from '@/data/types';
import { Hero } from '@/components/home/Hero';
import { FolderGrid } from '@/components/home/FolderGrid';
import { PresetCard } from '@/components/home/PresetCard';

const tones: IconName[] = ['ram', 'storage', 'gpu', 'cpu'];

const checks = [
  ['Процессор и плата', 'сокет, чипсет и нужна ли прошивка BIOS'],
  ['Память', 'поколение DDR и число слотов'],
  ['Блок питания', 'мощность с запасом и разъёмы для видеокарты'],
  ['Кулер', 'крепление, тепловыделение и высота в корпусе'],
  ['Корпус', 'размер платы и длина видеокарты'],
  ['Накопители', 'хватит ли слотов M.2'],
];

const name = (slug?: string) => (slug ? (getProduct(slug)?.name ?? '—') : '—');

export default function HomePage() {
  return (
    <div className="container home">
      <Hero />

      <section className="home__block" aria-labelledby="presets-title">
        <div className="section__head">
          <h2 id="presets-title" className="title-2">
            Собрать компьютер
          </h2>
          <Link href="/build" className="section__more">
            Конструктор
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="presets">
          {presets.map((p, i) => (
            <PresetCard
              key={p.id}
              index={i}
              tone={tones[i % tones.length]!}
              name={p.name}
              note={p.note}
              slots={p.slots}
              parts={[
                ['CPU', name(p.slots.cpu)],
                ['GPU', name(p.slots.gpu)],
              ]}
            />
          ))}
          <Link href="/build" className="preset preset--blank" style={{ ['--i' as string]: presets.length } as CSSProperties}>
            <span className="preset__icon" aria-hidden="true">
              <Plus size={22} />
            </span>
            <span className="preset__name">С нуля</span>
            <span className="preset__note">Выбирать детали самому, конструктор проверит каждую</span>
          </Link>
        </div>
      </section>

      <section className="home__block" aria-labelledby="categories-title">
        <div className="section__head">
          <h2 id="categories-title" className="title-2">
            Категории
          </h2>
          <Link href="/catalog" className="section__more">
            Все категории
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <FolderGrid />
      </section>

      <section className="home__block" aria-labelledby="checks-title">
        <h2 id="checks-title" className="title-2">
          Что проверяет конструктор
        </h2>
        <ul className="home-checks" role="list">
          {checks.map(([title, text], i) => (
            <li key={title} style={{ ['--i' as string]: i } as CSSProperties}>
              <b>{title}</b> — {text}
            </li>
          ))}
        </ul>
        <p className="text-muted">Если в данных о модели чего-то нет, проверка так и говорит: «не проверено» и почему.</p>
      </section>
    </div>
  );
}

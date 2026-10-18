'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, Check, CircleCheck, Cpu, Scale, Search } from 'lucide-react';

const d = (ms: number): CSSProperties => ({ ['--d' as string]: `${ms}ms` });

/** 01 — typing in search, suggestions appear, a quick filter switches on */
function SearchDemo() {
  return (
    <div className="demo demo--search">
      <div className="demo-input">
        <Search size={14} aria-hidden="true" />
        <span className="demo-type">Ryzen 7</span>
        <span className="demo-caret" />
      </div>
      <div className="demo-list">
        {[
          ['Ryzen 7 7800X3D', '8 / 16 · 5,0 ГГц'],
          ['Ryzen 7 7700', '8 / 16 · 5,3 ГГц'],
          ['Ryzen 7 9700X', '8 / 16 · 5,5 ГГц'],
        ].map(([name, sub], i) => (
          <div key={name} className={`demo-row${i === 0 ? ' demo-row--hl' : ''}`} style={d(i * 160)}>
            <span className="demo-ico">
              <Cpu size={12} aria-hidden="true" />
            </span>
            <span className="demo-row__text">
              <b>{name}</b>
              <small>{sub}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="demo-chips">
        <span className="demo-chip">AM4</span>
        <span className="demo-chip demo-chip--on">AM5</span>
        <span className="demo-chip">LGA1700</span>
      </div>
    </div>
  );
}

/** 02 — models fly into the comparison, value bars grow, the best one glows */
function CompareDemo() {
  const cols = [
    { name: 'Ryzen 5 7600', bars: [45, 60, 33], best: [false, false, true], c: '#ff9a7a' },
    { name: 'Ryzen 7 7800X3D', bars: [60, 55, 100], best: [false, false, false], c: '#b49bff' },
    { name: 'Core i5-14600K', bars: [100, 100, 25], best: [true, true, false], c: '#6fe3cf' },
  ];
  return (
    <div className="demo demo--compare">
      {cols.map((col, i) => (
        <div key={col.name} className="demo-col" style={{ ...d(i * 260), ['--c' as string]: col.c } as CSSProperties}>
          <span className="demo-col__dot" />
          <b className="demo-col__name">{col.name}</b>
          {col.bars.map((w, j) => (
            <span key={j} className={`demo-bar${col.best[j] ? ' demo-bar--best' : ''}`}>
              <span style={{ ...d(i * 260 + j * 120), ['--w' as string]: `${w}%` } as CSSProperties} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** 03 — slots get checked one by one, the last one warns, progress fills */
function CompatDemo() {
  const rows = ['Процессор и плата', 'Процессор и память', 'Плата и память', 'Блок питания'];
  return (
    <div className="demo demo--compat">
      {rows.map((row, i) => (
        <div key={row} className="demo-check" style={d(i * 450)}>
          <span className={`demo-check__ico${i === 3 ? ' demo-check__ico--warn' : ''}`}>
            {i === 3 ? '!' : <Check size={11} strokeWidth={3} aria-hidden="true" />}
          </span>
          <span className="demo-check__label">{row}</span>
          <span className="demo-check__state">{i === 3 ? 'впритык' : 'ок'}</span>
        </div>
      ))}
      <div className="demo-progress">
        <span />
      </div>
    </div>
  );
}

interface Feature {
  href: string;
  cta: string;
  title: string;
  text: string;
  icon: ReactNode;
  demo: ReactNode;
}

const features: Feature[] = [
  {
    href: '/catalog',
    cta: 'Открыть каталог',
    title: 'Поиск',
    text: 'Пишите модель, бренд или сокет, и подходящие модели появятся прямо под строкой. В каталоге их можно отфильтровать по сокету, памяти и бренду.',
    icon: <Search size={18} />,
    demo: <SearchDemo />,
  },
  {
    href: '/compare',
    cta: 'Открыть сравнение',
    title: 'Сравнение',
    text: 'Добавьте до четырёх моделей одной категории. На одной странице видно, чем они отличаются и где какое значение лучше.',
    icon: <Scale size={18} />,
    demo: <CompareDemo />,
  },
  {
    href: '/compatibility',
    cta: 'Собрать комплект',
    title: 'Совместимость',
    text: 'Выберите процессор, плату, память, видеокарту, блок питания и корпус. Справочник проверит сокет, тип памяти, мощность и размеры.',
    icon: <CircleCheck size={18} />,
    demo: <CompatDemo />,
  },
];

export function Features() {
  const ref = useRef<HTMLUListElement>(null);
  const [inView, setInView] = useState(false);

  // Demos run only while the section is on screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ul ref={ref} className={`feature-grid${inView ? ' is-inview' : ''}`} role="list">
      {features.map((f, i) => (
        <li key={f.href} className="card feature" style={{ ['--i' as string]: i } as CSSProperties}>
          <div className="feature__demo" aria-hidden="true">
            {f.demo}
          </div>
          <div className="feature__top">
            <span className="feature__icon" aria-hidden="true">
              {f.icon}
            </span>
            <h3 className="feature__title">{f.title}</h3>
          </div>
          <p className="feature__text">{f.text}</p>
          <Link href={f.href} className="feature__cta">
            {f.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

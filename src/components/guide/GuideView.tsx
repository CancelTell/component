'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, Pause, Play, RotateCcw, TriangleAlert } from 'lucide-react';
import { createPersistentStore } from '@/lib/store';
import { guideSteps } from './steps';
import type { GuideStep } from './types';

const doneStore = createPersistentStore<string[]>('component:guide-done', []);

/** Runs the scene's tracks on one shared timeline and reports the current phase */
function useScenePlayer(step: GuideStep, playing: boolean) {
  const rootRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const anims = useRef<Animation[]>([]);
  const [phase, setPhase] = useState(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof root.animate !== 'function') return;
    const list: Animation[] = [];
    // Master clock first: its currentTime drives the phase list and the progress bar
    list.push(root.animate([{ opacity: 1 }, { opacity: 1 }], { duration: step.duration, iterations: Infinity }));
    root.querySelectorAll<SVGElement>('[data-t]').forEach((el) => {
      const kf = step.tracks[el.dataset.t ?? ''];
      if (kf) list.push(el.animate(kf, { duration: step.duration, iterations: Infinity, fill: 'both' }));
    });
    anims.current = list;
    setPhase(0);
    return () => list.forEach((a) => a.cancel());
  }, [step]);

  useEffect(() => {
    anims.current.forEach((a) => (playing ? a.play() : a.pause()));
  }, [playing, step]);

  // Progress bar and active phase follow the clock
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const clock = anims.current[0];
      const t = clock ? (Number(clock.currentTime ?? 0) % step.duration) / step.duration : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${t})`;
      let p = 0;
      step.phases.forEach((ph, i) => {
        if (t >= ph.at) p = i;
      });
      if (p !== last) {
        last = p;
        setPhase(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const seek = useCallback(
    (fraction: number) => {
      anims.current.forEach((a) => {
        a.currentTime = fraction * step.duration;
      });
    },
    [step],
  );

  return { rootRef, barRef, phase, seek };
}

export function GuideView() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const done = doneStore.useStore();
  const stageRef = useRef<HTMLDivElement>(null);
  const step = guideSteps[index]!;
  // Pause off-screen to save battery; the user's play/pause choice is kept separately
  const [visible, setVisible] = useState(true);
  const { rootRef, barRef, phase, seek } = useScenePlayer(step, playing && visible);

  // ?step=cpu opens a specific step; reduced motion starts paused
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('step');
    const i = guideSteps.findIndex((s) => s.id === id);
    if (i > 0) setIndex(i);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
  }, []);

  // Keep the current step chip in view on phones (horizontal list)
  useEffect(() => {
    const chip = document.querySelector<HTMLElement>('.guide-steps__item[aria-current="step"]');
    const list = chip?.closest('ol');
    if (!chip || !list || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: chip.offsetLeft - list.clientWidth / 2 + chip.offsetWidth / 2, behavior: 'smooth' });
  }, [index]);

  const go = useCallback((i: number) => {
    const next = Math.max(0, Math.min(guideSteps.length - 1, i));
    setIndex(next);
    const url = new URL(window.location.href);
    url.searchParams.set('step', guideSteps[next]!.id);
    window.history.replaceState(window.history.state, '', url);
  }, []);

  // Keyboard: ← → steps, space play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === ' ' && target.closest('.guide-player')) {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isDone = (id: string) => done.includes(id);
  const toggleDone = (id: string, value = !isDone(id)) =>
    doneStore.set((prev) => (value ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));

  /** Click on an action: jump to it. While paused show its middle, while playing start from it */
  const jump = (i: number) => {
    const from = step.phases[i]!.at;
    const to = step.phases[i + 1]?.at ?? 1;
    seek(playing ? from : from + (to - from) * 0.7);
  };

  const next = guideSteps[index + 1];
  const prev = guideSteps[index - 1];
  const doneCount = guideSteps.filter((s) => isDone(s.id)).length;

  return (
    <div className="guide">
      <div className="guide-progress" aria-label={`Пройдено ${doneCount} из ${guideSteps.length}`}>
        <div className="guide-progress__bar" aria-hidden="true">
          {guideSteps.map((s, i) => (
            <span key={s.id} data-done={isDone(s.id) || undefined} data-current={i === index || undefined} />
          ))}
        </div>
        <span className="guide-progress__text">
          Пройдено {doneCount} из {guideSteps.length}
        </span>
      </div>

      <div className="guide__layout">
        <nav className="guide-steps" aria-label="Шаги сборки">
          <ol role="list">
            {guideSteps.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="guide-steps__item"
                  aria-current={i === index ? 'step' : undefined}
                  data-done={isDone(s.id) || undefined}
                  onClick={() => go(i)}
                >
                  <span className="guide-steps__num">{isDone(s.id) ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                  <span className="guide-steps__name">{s.short}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <section className="card guide-player" aria-labelledby="guide-step-title" tabIndex={-1}>
          <header className="guide-player__head">
            <div>
              <p className="guide-player__count">
                Шаг {index + 1} из {guideSteps.length}
              </p>
              <h2 id="guide-step-title" className="guide-player__title">
                {step.title}
              </h2>
            </div>
            <button
              type="button"
              className={`btn btn--outline guide-player__done${isDone(step.id) ? ' is-done' : ''}`}
              aria-pressed={isDone(step.id)}
              onClick={() => toggleDone(step.id)}
            >
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              {isDone(step.id) ? 'Сделано' : 'Отметить'}
            </button>
          </header>

          <div className="guide-stage" ref={stageRef}>
            <svg
              key={step.id}
              ref={rootRef}
              className="gscene guide-stage__svg"
              viewBox="0 0 480 320"
              role="img"
              aria-label={`Анимация: ${step.title}`}
            >
              <step.Art />
            </svg>

            <div className="guide-stage__controls">
              <button
                type="button"
                className="guide-stage__btn"
                aria-label={playing ? 'Пауза' : 'Смотреть'}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <div className="guide-stage__timeline">
                {step.phases.map((ph, i) => {
                  const end = step.phases[i + 1]?.at ?? 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      className="guide-stage__seg"
                      data-active={i === phase || undefined}
                      data-past={i < phase || undefined}
                      style={{ flexGrow: end - ph.at } as CSSProperties}
                      aria-label={`Действие ${i + 1}`}
                      onClick={() => jump(i)}
                    />
                  );
                })}
                <span className="guide-stage__playhead" aria-hidden="true">
                  <span ref={barRef} />
                </span>
              </div>
              <button type="button" className="guide-stage__btn" aria-label="С начала" onClick={() => seek(0)}>
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <ol className="guide-actions" role="list">
            {step.phases.map((ph, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="guide-actions__item"
                  data-active={i === phase || undefined}
                  data-past={i < phase || undefined}
                  onClick={() => jump(i)}
                >
                  <span className="guide-actions__num">{i + 1}</span>
                  <span className="guide-actions__text">{ph.text}</span>
                </button>
              </li>
            ))}
          </ol>

          <p className="guide-tip">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{step.tip}</span>
          </p>

          <footer className="guide-player__foot">
            <button type="button" className="btn btn--ghost" disabled={!prev} onClick={() => go(index - 1)}>
              <ArrowLeft size={18} aria-hidden="true" />
              Назад
            </button>
            {next ? (
              <button
                type="button"
                className="btn btn--accent guide-player__next"
                onClick={() => {
                  toggleDone(step.id, true);
                  go(index + 1);
                  document.querySelector('.guide-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Готово, дальше: {next.short}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <Link href="/compatibility" className="btn btn--accent guide-player__next" onClick={() => toggleDone(step.id, true)}>
                Готово. Собрать комплект в конструкторе
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}

/*
  Tiny keyframe helper for the guide scenes.
  Every animated SVG element carries data-t="trackName"; a scene maps track names to frames.
  All tracks share one duration, so a single currentTime seeks the whole scene.
*/

export interface FrameProps {
  x?: number;
  y?: number;
  /** rotation, deg */
  r?: number;
  s?: number;
  sx?: number;
  sy?: number;
  o?: number;
  /** stroke-dashoffset for paths with pathLength=1 */
  d?: number;
  /** easing of the segment that starts at this frame */
  e?: string;
}

export type Frame = [offset: number, props: FrameProps];

const EASE = 'cubic-bezier(0.45, 0.05, 0.3, 1)';

/**
 * Turns sparse frames into WAAPI keyframes. Values carry forward, so `[0.8, {}]`
 * means "hold the previous state until 0.8".
 */
export function tr(...frames: Frame[]): Keyframe[] {
  const state = { x: 0, y: 0, r: 0, sx: 1, sy: 1, o: 1, d: undefined as number | undefined };
  const sorted = [...frames].sort((a, b) => a[0] - b[0]);
  if (sorted[0]?.[0] !== 0) sorted.unshift([0, {}]);
  if (sorted[sorted.length - 1]?.[0] !== 1) sorted.push([1, {}]);

  return sorted.map(([offset, p]) => {
    if (p.x !== undefined) state.x = p.x;
    if (p.y !== undefined) state.y = p.y;
    if (p.r !== undefined) state.r = p.r;
    if (p.s !== undefined) state.sx = state.sy = p.s;
    if (p.sx !== undefined) state.sx = p.sx;
    if (p.sy !== undefined) state.sy = p.sy;
    if (p.o !== undefined) state.o = p.o;
    if (p.d !== undefined) state.d = p.d;
    const kf: Keyframe = {
      offset,
      easing: p.e ?? EASE,
      transform: `translate(${state.x}px, ${state.y}px) rotate(${state.r}deg) scale(${state.sx}, ${state.sy})`,
      opacity: state.o,
    };
    if (state.d !== undefined) kf.strokeDashoffset = String(state.d);
    return kf;
  });
}

/** Opacity-only shortcut: visible between `from` and `to` (fractions of the loop) */
export const show = (from: number, to = 0.97, fade = 0.03): Keyframe[] =>
  tr([0, { o: 0 }], [Math.max(0, from - fade), { o: 0 }], [from, { o: 1 }], [to, {}], [Math.min(1, to + fade), { o: 0 }]);

/** Draws a path (pathLength=1) between two moments and keeps it until the loop ends */
export const draw = (from: number, to: number, end = 0.97): Keyframe[] =>
  tr([0, { d: 1, o: 1 }], [from, { d: 1 }], [to, { d: 0 }], [end, { o: 1 }], [1, { o: 0 }]);

/** Expanding "click" ring at a moment */
export const ring = (at: number): Keyframe[] =>
  tr([0, { s: 0.3, o: 0 }], [at, { s: 0.3, o: 0 }], [Math.min(1, at + 0.01), { o: 1 }], [Math.min(1, at + 0.08), { s: 2.2, o: 0 }]);

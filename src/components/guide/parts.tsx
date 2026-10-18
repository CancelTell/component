import type { CSSProperties, ReactNode } from 'react';
import { Hand } from './Hand';

/** Origin for rotate/scale tracks, in scene (viewBox) coordinates */
export const at = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });

/** Animated group: `t` is the track name, inner content is positioned statically */
export function T({ t, x = 0, y = 0, origin, children, className }: { t: string; x?: number; y?: number; origin?: [number, number]; children: ReactNode; className?: string }) {
  return (
    <g data-t={t} className={className} style={origin ? at(origin[0], origin[1]) : undefined}>
      {x || y ? <g transform={`translate(${x} ${y})`}>{children}</g> : children}
    </g>
  );
}

/** A hand placed at (x, y), turned by `r` degrees (0 = fingers up, arm down) */
export function HandAt({ x, y, r = 0, pose, s = 0.8 }: { x: number; y: number; r?: number; pose: 'pinch' | 'press' | 'flat'; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <Hand pose={pose} />
    </g>
  );
}

export function Screw({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  const k = r * 0.55;
  return (
    <g>
      <circle className="g-screw" cx={x} cy={y} r={r} />
      <path className="g-screw-x" d={`M${x - k} ${y}h${k * 2}M${x} ${y - k}v${k * 2}`} />
    </g>
  );
}

/** Expanding ring that marks a click or a contact point */
export function Ring({ t, x, y, r = 12, tone = 'ok' }: { t: string; x: number; y: number; r?: number; tone?: 'ok' | 'hl' }) {
  return <circle data-t={t} className={`g-ring g-ring--${tone}`} cx={x} cy={y} r={r} />;
}

export function Label({ x, y, children, anchor = 'middle', tone }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; tone?: 'ok' | 'hl' | 'bad' }) {
  return (
    <text className={`g-label${tone ? ` g-label--${tone}` : ''}`} x={x} y={y} textAnchor={anchor}>
      {children}
    </text>
  );
}

/** Screwdriver with the tip at (0, 0), held by a hand; tilted so it reads as pointing into the scene */
export function Driver({ tilt = -28 }: { tilt?: number }) {
  return (
    <g transform={`rotate(${tilt})`}>
      <rect className="g-metal" x={-2.5} y={-46} width={5} height={46} rx={1.5} />
      <rect className="g-driver" x={-9} y={-104} width={18} height={60} rx={7} />
      <path className="g-driver-grip" d="M-4 -96v40M0 -98v44M4 -96v40" />
      <HandAt x={2} y={-78} r={168} pose="pinch" s={0.7} />
    </g>
  );
}

/** Rotating arrow around a screw: "turn it" */
export function TurnArrow({ t, x, y }: { t: string; x: number; y: number }) {
  return (
    <g data-t={t} style={at(x, y)}>
      <path className="g-turn" d={`M${x + 14} ${y} A14 14 0 1 1 ${x} ${y - 14}`} />
      <path className="g-turn-head" d={`M${x - 1} ${y - 19} l6 5 l-7 4 z`} />
    </g>
  );
}

/** Board edge seen from the side, with a few traces */
export function BoardSide({ y = 262, h = 18 }: { y?: number; h?: number }) {
  return (
    <g>
      <rect className="g-pcb" x={14} y={y} width={452} height={h} rx={3} />
      <path className="g-trace" d={`M24 ${y + h / 2}h120m30 0h90m40 0h140`} />
    </g>
  );
}

/** Open PC case seen from the side, with the board tray */
export function CaseFrame({ children }: { children?: ReactNode }) {
  return (
    <g>
      <rect className="g-case" x={30} y={14} width={420} height={296} rx={12} />
      <rect className="g-case-tray" x={44} y={26} width={392} height={272} rx={6} />
      <rect className="g-case-io" x={46} y={42} width={10} height={92} rx={2} />
      {[0, 3, 4, 5, 6].map((i) => (
        <rect key={i} className="g-case-slot" x={46} y={140 + i * 12} width={10} height={8} rx={1.5} />
      ))}
      {children}
    </g>
  );
}

/** Motherboard inside the case (case view), with the holes at the standoffs */
export const boardHoles: Array<[number, number]> = [
  [80, 42],
  [286, 42],
  [80, 136],
  [286, 136],
  [80, 222],
  [286, 222],
];

export function CaseBoard() {
  return (
    <g>
      <rect className="g-pcb" x={66} y={30} width={234} height={204} rx={4} />
      <path className="g-trace" d="M120 50v30h50M200 100h60v30M110 205h120" />
      <rect className="g-metal-d" x={66} y={38} width={22} height={70} rx={2} />
      <rect className="g-plug" x={98} y={32} width={20} height={8} rx={2} />
      <rect className="g-socket" x={138} y={52} width={60} height={60} rx={4} />
      <rect className="g-metal" x={148} y={62} width={40} height={40} rx={3} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} className="g-slot" x={222 + i * 11} y={44} width={6} height={84} rx={2} />
      ))}
      <rect className="g-slot" x={100} y={150} width={150} height={8} rx={2} />
      <rect className="g-slot" x={100} y={192} width={150} height={6} rx={2} />
      <rect className="g-plug" x={288} y={92} width={10} height={40} rx={2} />
      {boardHoles.map(([x, y]) => (
        <circle key={`${x}-${y}`} className="g-hole" cx={x} cy={y} r={4.5} />
      ))}
    </g>
  );
}

/** Cable that draws itself (pathLength=1): thick sleeve with a dotted core */
export function Cable({ t, d, thin = false }: { t: string; d: string; thin?: boolean }) {
  return (
    <g data-t={t} className={thin ? 'g-cable-thin' : undefined}>
      <path className="g-cable" d={d} pathLength={1} strokeDasharray="1 1" />
    </g>
  );
}

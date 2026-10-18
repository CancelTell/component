import type { CSSProperties, ReactNode, SVGProps } from 'react';
import type { IconName } from '@/data/types';

/*
  Vector illustrations of PC components (viewBox 240×160).
  Every outline has pathLength="1", so CSS can "draw" it via stroke-dashoffset (styles/art.css).
  `t` is the drawing delay in ms, so each picture builds up in sequence.
*/

type Timing = { t?: number };
const delay = (t = 0): CSSProperties => ({ ['--t' as string]: `${t}ms` });

function L({ t, className = '', ...rest }: Timing & SVGProps<SVGPathElement>) {
  return <path className={`art__l ${className}`} pathLength={1} style={delay(t)} {...rest} />;
}
function R({ t, solid, className = '', ...rest }: Timing & { solid?: boolean } & SVGProps<SVGRectElement>) {
  return <rect className={`art__l${solid ? ' art__f' : ''} ${className}`} pathLength={1} style={delay(t)} {...rest} />;
}
function C({ t, solid, className = '', ...rest }: Timing & { solid?: boolean } & SVGProps<SVGCircleElement>) {
  return <circle className={`art__l${solid ? ' art__f' : ''} ${className}`} pathLength={1} style={delay(t)} {...rest} />;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Fan: frame circle, hub and curved blades; the blade group spins while the art is active */
function Fan({ cx, cy, r, t = 0, blades = 7 }: { cx: number; cy: number; r: number; t?: number; blades?: number }) {
  const blade = `M0 ${-r * 0.3} C ${r * 0.38} ${-r * 0.42}, ${r * 0.62} ${-r * 0.66}, ${r * 0.3} ${-r * 0.9}`;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <C cx={0} cy={0} r={r} t={t} solid />
      <g className="art__spin">
        {range(blades).map((i) => (
          <L key={i} t={t + 160 + i * 35} d={blade} transform={`rotate(${(360 / blades) * i})`} />
        ))}
        <C cx={0} cy={0} r={r * 0.28} t={t + 120} solid />
      </g>
    </g>
  );
}

/** Circuit traces with solder dots, used as background detail */
function Traces({ paths, t = 0 }: { paths: Array<[string, number, number]>; t?: number }) {
  return (
    <g className="art__trace">
      {paths.map(([d, x, y], i) => (
        <g key={i}>
          <L t={t + i * 40} d={d} />
          <circle className="art__dot" cx={x} cy={y} r={2} style={delay(t + i * 40 + 300)} />
        </g>
      ))}
    </g>
  );
}

const arts: Record<IconName, () => ReactNode> = {
  gpu: () => (
    <>
      <Traces
        t={600}
        paths={[
          ['M28 138 H6', 6, 138],
          ['M212 60 H234', 234, 60],
          ['M212 100 H226 V122', 226, 122],
        ]}
      />
      <R x={18} y={34} width={10} height={96} rx={2} t={0} />
      <R x={28} y={42} width={184} height={80} rx={10} t={80} solid />
      <L className="art__a" t={260} d="M42 50 H198" />
      <Fan cx={82} cy={84} r={27} t={300} />
      <Fan cx={158} cy={84} r={27} t={420} />
      <L t={520} d="M62 122 V132 H170 V122" />
      {range(12).map((i) => (
        <L key={i} t={600 + i * 20} d={`M${70 + i * 8} 125 V130`} />
      ))}
    </>
  ),
  cpu: () => (
    <>
      <Traces
        t={700}
        paths={[
          ['M70 60 H40 L28 48 H10', 10, 48],
          ['M70 100 H34 L22 112', 22, 112],
          ['M170 70 H204 L216 58 H232', 232, 58],
          ['M170 110 H200 L212 122', 212, 122],
          ['M110 30 V12', 110, 12],
          ['M130 130 V150', 130, 150],
        ]}
      />
      <R x={70} y={30} width={100} height={100} rx={10} t={0} solid />
      <R x={86} y={46} width={68} height={68} rx={6} t={180} solid />
      <L className="art__a" t={360} d="M98 102 L142 58" />
      <L t={420} d="M74 34 L82 34 L74 42 Z" />
      {range(8).map((i) => (
        <g key={i}>
          <L t={300 + i * 25} d={`M${80 + i * 11} 30 V24`} />
          <L t={300 + i * 25} d={`M${80 + i * 11} 130 V136`} />
          <L t={300 + i * 25} d={`M70 ${40 + i * 11} H64`} />
          <L t={300 + i * 25} d={`M170 ${40 + i * 11} H176`} />
        </g>
      ))}
    </>
  ),
  motherboard: () => (
    <>
      <R x={36} y={12} width={168} height={136} rx={6} t={0} solid />
      <R x={72} y={34} width={46} height={46} rx={4} t={160} solid />
      <R x={80} y={42} width={30} height={30} rx={2} t={260} />
      <R x={56} y={24} width={10} height={58} rx={2} t={220} />
      <R x={72} y={22} width={46} height={7} rx={2} t={240} />
      {range(4).map((i) => (
        <R key={i} x={132 + i * 9} y={26} width={5} height={62} rx={1.5} t={320 + i * 50} />
      ))}
      <R x={48} y={102} width={110} height={6} rx={2} t={520} className="art__a" />
      <R x={48} y={124} width={110} height={6} rx={2} t={580} />
      <R x={170} y={100} width={22} height={22} rx={3} t={640} solid />
      <L t={700} d="M118 58 H128" />
      <L t={720} d="M95 80 V96 H140 V88" />
      <L t={760} d="M181 100 V92 H160" />
      {[
        [44, 20],
        [196, 20],
        [44, 140],
        [196, 140],
      ].map(([x, y], i) => (
        <C key={i} cx={x} cy={y} r={2.5} t={800 + i * 30} />
      ))}
    </>
  ),
  ram: () => (
    <>
      <L className="art__a" t={0} d="M24 44 H216" />
      <L t={80} d="M20 50 H70 L76 44 H164 L170 50 H220 V110 H128 V104 H120 V110 H20 Z" className="art__f" />
      {range(8).map((i) => (
        <R key={i} x={30 + i * 23.5} y={62} width={17} height={24} rx={2} t={280 + i * 45} solid />
      ))}
      {range(24).map((i) => (
        <L key={i} t={600 + i * 12} d={`M${26 + i * 8.2 + (i >= 12 ? 4 : 0)} 98 V106`} />
      ))}
      <L t={540} d="M30 92 H210" />
    </>
  ),
  storage: () => (
    <>
      <Traces
        t={700}
        paths={[
          ['M120 98 V122 H86', 86, 122],
          ['M170 62 V40 H196', 196, 40],
        ]}
      />
      <L t={0} className="art__f" d="M22 62 H210 A18 18 0 0 1 210 98 H22 V84 H28 V76 H22 Z" />
      {range(7).map((i) => (
        <L key={i} t={200 + i * 20} d={`M${25 + 0} ${64 + i * 4.6} H31`} />
      ))}
      <R x={46} y={68} width={30} height={24} rx={2} t={300} solid />
      <R x={88} y={66} width={40} height={28} rx={2} t={380} solid />
      <R x={138} y={66} width={40} height={28} rx={2} t={440} solid />
      <C cx={212} cy={80} r={6} t={520} />
      <L className="art__a" t={580} d="M50 74 H72" />
    </>
  ),
  psu: () => (
    <>
      <R x={40} y={20} width={160} height={120} rx={10} t={0} solid />
      <C cx={120} cy={80} r={48} t={140} />
      <C cx={120} cy={80} r={38} t={200} />
      <C cx={120} cy={80} r={28} t={260} />
      <Fan cx={120} cy={80} r={44} t={320} blades={9} />
      <R x={52} y={30} width={16} height={10} rx={2} t={520} className="art__a" />
      {[
        [48, 28],
        [192, 28],
        [48, 132],
        [192, 132],
      ].map(([x, y], i) => (
        <C key={i} cx={x} cy={y} r={2.5} t={560 + i * 30} />
      ))}
    </>
  ),
  cooling: () => (
    <>
      <R x={72} y={18} width={96} height={100} rx={4} t={0} solid />
      {range(14).map((i) => (
        <L key={i} t={100 + i * 25} d={`M76 ${24 + i * 6.8} H164`} />
      ))}
      <R x={86} y={32} width={68} height={68} rx={10} t={300} solid />
      <Fan cx={120} cy={66} r={30} t={380} />
      <L className="art__a" t={600} d="M92 118 V136 Q92 146 102 146 H138 Q148 146 148 136 V118" />
      <L t={660} d="M104 118 V132 Q104 138 110 138 H130 Q136 138 136 132 V118" />
      <R x={96} y={146} width={48} height={8} rx={2} t={720} solid />
    </>
  ),
  case: () => (
    <>
      <R x={66} y={10} width={108} height={140} rx={8} t={0} solid />
      <R x={76} y={20} width={72} height={120} rx={4} t={120} />
      <R x={84} y={28} width={44} height={56} rx={2} t={240} />
      <R x={92} y={40} width={16} height={16} rx={2} t={300} solid />
      <R x={84} y={92} width={52} height={10} rx={2} t={360} className="art__a" />
      <R x={76} y={114} width={72} height={26} rx={2} t={420} solid />
      <Fan cx={161} cy={40} r={9} t={480} blades={5} />
      <Fan cx={161} cy={66} r={9} t={540} blades={5} />
      <Fan cx={161} cy={92} r={9} t={600} blades={5} />
      <R x={74} y={150} width={16} height={4} rx={1} t={660} />
      <R x={150} y={150} width={16} height={4} rx={1} t={680} />
    </>
  ),
};

interface Props {
  name: IconName;
  className?: string;
}

export function ComponentArt({ name, className = '' }: Props) {
  return (
    <svg className={`art ${className}`} viewBox="0 0 240 160" fill="none" aria-hidden="true" focusable="false">
      {arts[name]()}
    </svg>
  );
}

/** Gradient pair per category for folder backs and art thumbnails */
export const artGradients: Record<IconName, [string, string]> = {
  cpu: ['#ff9a7a', '#b4302a'],
  gpu: ['#b49bff', '#4a2a9a'],
  motherboard: ['#6fe3cf', '#11695f'],
  ram: ['#ffd27a', '#b5641a'],
  storage: ['#9cc6ff', '#2847a8'],
  psu: ['#ffa3b5', '#992046'],
  cooling: ['#a8eefc', '#1b6a83'],
  case: ['#d8d2ce', '#4a4441'],
};

export function artStyle(name: IconName): CSSProperties {
  const [g1, g2] = artGradients[name];
  return { ['--g1' as string]: g1, ['--g2' as string]: g2 };
}

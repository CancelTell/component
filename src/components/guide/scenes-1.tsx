import { ring, show, tr } from './timeline';
import { HandAt, Label, Ring, T } from './parts';
import type { GuideStep } from './types';

/* ---------- 1. Подготовка: стол, инструменты, снять статику ---------- */
export const prep: GuideStep = {
  id: 'prep',
  title: 'Подготовка',
  short: 'Что понадобится',
  duration: 9000,
  phases: [
    { at: 0, text: 'Освободите стол: нужна ровная твёрдая поверхность и хороший свет' },
    { at: 0.12, text: 'Крестовая отвёртка PH2 подходит почти ко всем винтам в корпусе' },
    { at: 0.3, text: 'Термопаста понадобится, если её нет на кулере заранее' },
    { at: 0.45, text: 'Стяжки или липучки, чтобы собрать провода' },
    { at: 0.58, text: 'Перед работой коснитесь металла корпуса, чтобы снять статический заряд' },
  ],
  tip: 'Коробку от материнской платы не выбрасывайте: на ней удобно поставить процессор, память и кулер до установки платы в корпус.',
  tracks: {
    mat: tr([0, { o: 0 }], [0.06, { o: 1 }], [0.96, {}], [1, { o: 0 }]),
    driver: tr([0, { x: -300, o: 0 }], [0.12, { x: -300, o: 0 }], [0.13, { o: 1 }], [0.2, { x: 0 }], [0.96, {}], [1, { o: 0 }]),
    paste: tr([0, { y: -220, o: 0 }], [0.3, { y: -220, o: 0 }], [0.31, { o: 1 }], [0.38, { y: 0 }], [0.96, {}], [1, { o: 0 }]),
    ties: tr([0, { y: 30, o: 0 }], [0.45, { y: 30, o: 0 }], [0.52, { y: 0, o: 1 }], [0.96, {}], [1, { o: 0 }]),
    case: tr([0, { x: 220, o: 0 }], [0.58, { x: 220, o: 0 }], [0.59, { o: 1 }], [0.65, { x: 0 }], [0.96, {}], [1, { o: 0 }]),
    hand: tr([0, { y: 240 }], [0.64, { y: 240 }], [0.72, { y: 0 }], [0.86, {}], [0.94, { y: 240 }]),
    zap: tr([0, { o: 0, s: 0.6 }], [0.72, { o: 0, s: 0.6 }], [0.74, { o: 1, s: 1 }], [0.84, { o: 0 }]),
    touch: ring(0.72),
    touchLabel: show(0.74, 0.92),
  },
  Art: () => (
    <>
      <T t="mat">
        <rect className="g-mat" x={24} y={22} width={432} height={276} rx={18} />
        <path className="g-mat-grid" d="M24 80h432M24 140h432M24 200h432M24 260h432M100 22v276M200 22v276M300 22v276M400 22v276" />
      </T>

      <T t="driver">
        <rect className="g-driver" x={58} y={78} width={82} height={26} rx={10} />
        <path className="g-driver-grip" d="M70 84h58M70 91h58M70 98h58" />
        <rect className="g-metal-d" x={140} y={84} width={9} height={14} rx={2} />
        <rect className="g-metal" x={149} y={88} width={74} height={6} rx={2} />
        <path className="g-metal" d="M223 88l10 3l-10 3z" />
        <Label x={146} y={130}>Отвёртка PH2</Label>
      </T>

      <T t="paste">
        <rect className="g-plunger" x={262} y={82} width={16} height={16} rx={3} />
        <rect className="g-tube" x={276} y={76} width={96} height={28} rx={8} />
        <rect className="g-tube-band" x={300} y={76} width={34} height={28} />
        <path className="g-metal-d" d="M372 84h18l10 6l-10 6h-18z" />
        <Label x={330} y={130}>Термопаста</Label>
      </T>

      <T t="ties">
        <path className="g-tie" d="M62 190c34-18 84-18 120-2" />
        <path className="g-tie" d="M62 206c34-18 84-18 120-2" />
        <path className="g-tie" d="M62 222c34-18 84-18 120-2" />
        <rect className="g-tie-head" x={178} y={182} width={10} height={9} rx={2} />
        <rect className="g-tie-head" x={178} y={198} width={10} height={9} rx={2} />
        <rect className="g-tie-head" x={178} y={214} width={10} height={9} rx={2} />
        <Label x={122} y={252}>Стяжки</Label>
      </T>

      <T t="case">
        <rect className="g-case" x={300} y={160} width={170} height={150} rx={10} />
        <rect className="g-case-tray" x={312} y={172} width={146} height={126} rx={6} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} className="g-vent" x={382} y={186 + i * 14} width={60} height={5} rx={2.5} />
        ))}
        <Label x={340} y={154} anchor="start">Корпус</Label>
      </T>

      <T t="zap" origin={[346, 236]}>
        <path className="g-zap" d="M330 212l10 12h-8l12 14" />
        <path className="g-zap" d="M362 214l-8 10h8l-10 14" />
      </T>
      <Ring t="touch" x={346} y={236} r={14} />
      <T t="hand">
        <HandAt x={346} y={236} pose="press" s={0.85} />
      </T>
      <T t="touchLabel">
        <Label x={250} y={282} tone="ok">заряд ушёл в корпус</Label>
      </T>
    </>
  ),
};

/* ---------- 2. Процессор: рычаг, рамка, треугольник, без нажима ---------- */
const CPU_C: [number, number] = [240, 160];

export const cpu: GuideStep = {
  id: 'cpu',
  title: 'Процессор',
  short: 'Процессор в сокет',
  duration: 11000,
  phases: [
    { at: 0, text: 'Нажмите на рычаг сокета, отведите его в сторону и поднимите' },
    { at: 0.2, text: 'Откиньте прижимную рамку' },
    { at: 0.3, text: 'Совместите золотой треугольник на процессоре с меткой на сокете' },
    { at: 0.58, text: 'Опустите процессор ровно, без нажима: он ляжет под своим весом' },
    { at: 0.7, text: 'Закройте рамку и заведите рычаг под зацеп' },
  ],
  tip: 'Держите процессор за края и не касайтесь контактов. Если он не ложится, не давите: проверьте треугольник.',
  tracks: {
    lever: tr([0, {}], [0.08, {}], [0.11, { x: 8 }], [0.17, { sy: 0.3 }], [0.82, {}], [0.88, { sy: 1 }], [0.9, { x: 0 }]),
    leverHand: tr(
      [0, { x: 200, o: 0 }],
      [0.03, { x: 200, o: 1 }],
      [0.08, { x: 0 }],
      [0.11, { x: 8 }],
      [0.17, { y: -99 }],
      [0.23, { x: 220 }],
      [0.76, { x: 220, y: -99 }],
      [0.82, { x: 8 }],
      [0.88, { y: 0 }],
      [0.9, { x: 0 }],
      [0.96, { x: 220 }],
    ),
    frame: tr([0, {}], [0.21, {}], [0.28, { sy: 0.2, y: -6 }], [0.72, {}], [0.79, { sy: 1, y: 0 }]),
    cpu: tr(
      [0, { y: -300, r: 90, s: 1.08, o: 0 }],
      [0.3, { y: -300, o: 0 }],
      [0.31, { o: 1 }],
      [0.42, { y: 0, r: 90 }],
      [0.47, {}],
      [0.55, { r: 0 }],
      [0.6, { s: 1.08 }],
      [0.66, { s: 1 }],
      [0.97, {}],
      [1, { o: 0 }],
    ),
    cpuHand: tr(
      [0, { y: -300, r: 90, s: 1.08, o: 0 }],
      [0.3, { y: -300, o: 0 }],
      [0.31, { o: 1 }],
      [0.42, { y: 0, r: 90 }],
      [0.47, {}],
      [0.55, { r: 0 }],
      [0.6, { s: 1.08 }],
      [0.66, { s: 1 }],
      [0.69, {}],
      [0.76, { y: -300 }],
    ),
    wrong: show(0.43, 0.5, 0.02),
    right: show(0.55, 0.66, 0.02),
    matchRing: ring(0.55),
    clickRing: ring(0.9),
    leverLabel: show(0.02, 0.2),
  },
  Art: () => (
    <>
      <defs>
        <pattern id="g-pins" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" className="g-pin" />
        </pattern>
      </defs>
      <rect className="g-pcb" x={0} y={0} width={480} height={320} />
      <path className="g-trace" d="M20 40h100v40M360 30v60h90M30 280h120l20-20M340 290h110M410 200v60" />

      <rect className="g-socket" x={172} y={92} width={136} height={136} rx={6} />
      <rect fill="url(#g-pins)" x={180} y={100} width={120} height={120} rx={4} />
      <path className="g-gold" d="M180 220v-14l14 14z" />

      <T t="frame" origin={[240, 84]}>
        <rect className="g-frame" x={164} y={84} width={152} height={152} rx={8} />
      </T>

      <T t="cpu" origin={CPU_C}>
        <rect className="g-cpu" x={185} y={105} width={110} height={110} rx={6} />
        <rect className="g-cpu-ihs" x={197} y={117} width={86} height={86} rx={8} />
        <path className="g-gold" d="M188 212v-14l14 14z" />
      </T>

      <T t="wrong">
        <circle className="g-mark g-mark--bad" cx={186} cy={214} r={13} />
        <Label x={184} y={250} tone="bad">треугольники не совпали</Label>
      </T>
      <T t="right">
        <circle className="g-mark g-mark--ok" cx={186} cy={214} r={13} />
        <Label x={184} y={250} tone="ok">метки совпали</Label>
      </T>
      <Ring t="matchRing" x={186} y={214} r={14} />

      <T t="cpuHand" origin={CPU_C}>
        <HandAt x={240} y={104} r={180} pose="pinch" />
      </T>

      <T t="lever" origin={[330, 94]}>
        <path className="g-lever" d="M330 94V238h-16" />
      </T>
      <T t="leverLabel">
        <Label x={350} y={86} anchor="start">рычаг</Label>
      </T>
      <Ring t="clickRing" x={322} y={238} r={12} />
      <T t="leverHand">
        <HandAt x={318} y={240} r={-40} pose="press" s={0.75} />
      </T>
    </>
  ),
};

/* ---------- 3. Оперативная память (вид сбоку + схема слотов) ---------- */
export const ram: GuideStep = {
  id: 'ram',
  title: 'Оперативная память',
  short: 'Память в слоты',
  duration: 9500,
  phases: [
    { at: 0, text: 'Откройте защёлки по краям слота' },
    { at: 0.15, text: 'Для двух планок нужны слоты A2 и B2, второй и четвёртый от процессора' },
    { at: 0.32, text: 'Совместите вырез на контактах планки с перегородкой в слоте' },
    { at: 0.56, text: 'Нажмите на оба края сразу, до щелчка' },
    { at: 0.76, text: 'Защёлки должны закрыться сами. Если нет, дожмите' },
  ],
  tip: 'Вырез смещён от центра, поэтому неправильно планку не вставить. Если она не идёт, разверните её, а не давите сильнее.',
  tracks: {
    latchL: tr([0, {}], [0.04, {}], [0.12, { r: -38 }], [0.64, {}], [0.68, { r: 0 }]),
    latchR: tr([0, {}], [0.04, {}], [0.12, { r: 38 }], [0.64, {}], [0.68, { r: 0 }]),
    map: show(0.14, 0.97),
    mapHl: tr([0, { o: 0 }], [0.16, { o: 0 }], [0.2, { o: 1 }], [0.24, { o: 0.3 }], [0.28, { o: 1 }], [0.32, { o: 0.4 }], [0.36, { o: 1 }], [0.97, {}], [1, { o: 0 }]),
    stick: tr([0, { y: -260, o: 0 }], [0.32, { y: -260, o: 0 }], [0.33, { o: 1 }], [0.44, { y: 0 }], [0.58, {}], [0.66, { y: 108 }], [0.97, {}], [1, { o: 0 }]),
    hands: tr([0, { y: -260, o: 0 }], [0.32, { y: -260, o: 0 }], [0.33, { o: 1 }], [0.44, { y: 0 }], [0.58, {}], [0.66, { y: 108 }], [0.76, {}], [0.86, { y: -60, o: 0 }]),
    notch: show(0.45, 0.58),
    clickL: ring(0.68),
    clickR: ring(0.68),
    clickLabel: show(0.69, 0.84),
  },
  Art: () => (
    <>
      <BoardSideLocal />
      <T t="stick">
        <rect className="g-ram-heat" x={114} y={44} width={252} height={40} rx={4} />
        <rect className="g-pcb-2" x={116} y={80} width={248} height={36} rx={2} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} className="g-chip" x={124 + i * 30} y={88} width={22} height={20} rx={2} />
        ))}
        <rect className="g-gold" x={120} y={116} width={104} height={8} />
        <rect className="g-gold" x={234} y={116} width={126} height={8} />
      </T>
      <rect className="g-slot-side" x={106} y={224} width={268} height={30} rx={3} />
      <rect className="g-slot-key" x={225} y={220} width={8} height={14} rx={1.5} />
      <T t="latchL" origin={[110, 250]}>
        <rect className="g-latch" x={100} y={204} width={11} height={48} rx={3} />
      </T>
      <T t="latchR" origin={[370, 250]}>
        <rect className="g-latch" x={369} y={204} width={11} height={48} rx={3} />
      </T>
      <T t="notch">
        <path className="g-guide-line" d="M229 128V222" />
        <Label x={238} y={170} anchor="start" tone="hl">вырез = перегородка</Label>
      </T>
      <Ring t="clickL" x={106} y={212} />
      <Ring t="clickR" x={374} y={212} />
      <T t="clickLabel">
        <Label x={240} y={300} tone="ok">щёлк</Label>
      </T>
      <T t="hands">
        <HandAt x={150} y={46} r={180} pose="flat" s={0.62} />
        <HandAt x={330} y={46} r={180} pose="flat" s={0.62} />
      </T>

      <T t="map">
        <rect className="g-mini" x={368} y={12} width={100} height={102} rx={8} />
        <rect className="g-mini-cpu" x={378} y={36} width={26} height={26} rx={3} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} className="g-mini-slot" x={418 + i * 12} y={22} width={6} height={58} rx={2} />
        ))}
        <text className="g-mini-text" x={418} y={106} textAnchor="middle">вид сверху</text>
      </T>
      <T t="mapHl">
        <rect className="g-mini-hl" x={427} y={19} width={12} height={64} rx={3} />
        <rect className="g-mini-hl" x={451} y={19} width={12} height={64} rx={3} />
        <text className="g-mini-text g-mini-text--hl" x={433} y={94} textAnchor="middle">A2</text>
        <text className="g-mini-text g-mini-text--hl" x={457} y={94} textAnchor="middle">B2</text>
      </T>
    </>
  ),
};

function BoardSideLocal() {
  return (
    <g>
      <rect className="g-pcb" x={14} y={254} width={452} height={20} rx={3} />
      <path className="g-trace" d="M24 264h70m300 0h60" />
    </g>
  );
}


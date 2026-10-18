import { draw, ring, show, tr, type Frame } from './timeline';
import { BoardSide, Cable, CaseBoard, CaseFrame, Driver, HandAt, Label, Ring, Screw, T, TurnArrow, boardHoles } from './parts';
import type { GuideStep } from './types';

/** Visible in several windows: [[from, to], ...] */
const windows = (...w: Array<[number, number]>) =>
  tr([0, { o: 0 }], ...w.flatMap(([a, b]): Frame[] => [[a, { o: 0 }], [a + 0.01, { o: 1 }], [b, { o: 1 }], [b + 0.01, { o: 0 }]]));

/* ---------- 4. Кулер и термопаста (вид сбоку) ---------- */
export const cooler: GuideStep = {
  id: 'cooler',
  title: 'Кулер и термопаста',
  short: 'Кулер',
  duration: 11500,
  phases: [
    { at: 0, text: 'Выдавите в центр процессора каплю термопасты размером с горошину' },
    { at: 0.26, text: 'Снимите защитную плёнку с основания кулера' },
    { at: 0.5, text: 'Опустите кулер ровно, не сдвигая его по процессору' },
    { at: 0.62, text: 'Затягивайте винты крест-накрест, понемногу каждый' },
    { at: 0.87, text: 'Кабель вентилятора подключите к разъёму CPU_FAN на плате' },
  ],
  tip: 'Если на основании кулера уже есть серый слой термопасты, свою не добавляйте. Размазывать каплю не нужно: кулер распределит её сам.',
  tracks: {
    tube: tr([0, { y: -280, o: 0 }], [0.02, { o: 1 }], [0.1, { y: 0 }], [0.2, {}], [0.25, { y: -280 }], [0.26, { o: 0 }]),
    dot: tr([0, { s: 0 }], [0.11, { s: 0 }], [0.2, { s: 1 }], [0.55, {}], [0.6, { sx: 5.6, sy: 0.45 }], [0.97, {}], [1, { o: 0 }]),
    cooler: tr([0, { y: -340, o: 0 }], [0.26, { y: -340, o: 0 }], [0.27, { o: 1 }], [0.32, { y: -110 }], [0.5, {}], [0.6, { y: 0 }], [0.97, {}], [1, { o: 0 }]),
    film: tr([0, { y: -340, o: 0 }], [0.26, { y: -340, o: 0 }], [0.27, { o: 1 }], [0.32, { y: -110 }], [0.36, {}], [0.46, { x: 250, r: 10 }], [0.48, { o: 0 }]),
    filmHand: tr([0, { x: 220, y: -110, o: 0 }], [0.3, { x: 220, o: 0 }], [0.31, { o: 1 }], [0.36, { x: 0 }], [0.46, { x: 250 }], [0.5, { x: 320 }]),
    driver: tr(
      [0, { y: -280, o: 0 }],
      [0.6, { y: -280, o: 0 }],
      [0.61, { o: 1 }],
      [0.65, { y: 0, x: 0 }],
      [0.69, {}],
      [0.71, { x: 168 }],
      [0.75, {}],
      [0.77, { x: 0 }],
      [0.8, {}],
      [0.82, { x: 168 }],
      [0.85, {}],
      [0.89, { y: -280 }],
    ),
    turnSpin: tr([0, { r: 0, e: 'linear' }], [1, { r: -4320 }]),
    turnL: windows([0.65, 0.69], [0.77, 0.8]),
    turnR: windows([0.71, 0.75], [0.82, 0.85]),
    nums: show(0.63, 0.88),
    cable: draw(0.87, 0.95),
    fanLabel: show(0.9, 0.97),
  },
  Art: () => (
    <>
      <BoardSide y={262} />
      <rect className="g-socket" x={172} y={248} width={136} height={14} rx={2} />
      <rect className="g-cpu" x={184} y={242} width={112} height={6} />
      <rect className="g-metal" x={196} y={232} width={88} height={10} rx={2} />
      <rect className="g-plug" x={74} y={254} width={24} height={8} rx={2} />

      <T t="dot" origin={[240, 232]}>
        <ellipse className="g-paste" cx={240} cy={228} rx={8} ry={4.5} />
      </T>

      <T t="tube">
        <rect className="g-plunger" x={232} y={-4} width={16} height={18} rx={3} />
        <rect className="g-tube" x={226} y={12} width={28} height={180} rx={8} />
        <rect className="g-tube-band" x={226} y={60} width={28} height={30} />
        <path className="g-metal-d" d="M232 192h16l-5 32h-6z" />
        <HandAt x={256} y={130} r={-90} pose="pinch" s={0.72} />
      </T>

      <T t="cooler">
        <rect className="g-fan" x={150} y={44} width={18} height={140} rx={4} />
        <rect className="g-fins" x={168} y={48} width={144} height={132} rx={4} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <path key={i} className="g-fin-line" d={`M172 ${60 + i * 11}h136`} />
        ))}
        <path className="g-pipe" d="M198 214V176M220 214V176M260 214V176M282 214V176" />
        <rect className="g-metal-d" x={146} y={206} width={188} height={6} rx={3} />
        <rect className="g-copper" x={182} y={214} width={116} height={16} rx={2} />
        <rect className="g-metal" x={150} y={196} width={12} height={10} rx={2} />
        <rect className="g-metal" x={318} y={196} width={12} height={10} rx={2} />
      </T>
      <T t="film" origin={[300, 232]}>
        <rect className="g-film" x={182} y={230} width={116} height={4} />
        <rect className="g-film" x={296} y={228} width={24} height={9} rx={2} />
      </T>
      <T t="filmHand">
        <HandAt x={320} y={232} r={-90} pose="pinch" s={0.72} />
      </T>

      <T t="nums">
        <Label x={156} y={186}>1</Label>
        <Label x={324} y={186}>2</Label>
      </T>
      <T t="turnL">
        <TurnArrow t="turnSpin" x={156} y={196} />
      </T>
      <T t="turnR">
        <TurnArrow t="turnSpin" x={324} y={196} />
      </T>
      <T t="driver">
        <g transform="translate(156 196)">
          <Driver tilt={0} />
        </g>
      </T>

      <g data-t="cable">
        <path className="g-wire g-wire--fan" d="M159 184C150 236 112 246 86 254" pathLength={1} strokeDasharray="1 1" />
      </g>
      <T t="fanLabel">
        <Label x={86} y={300}>CPU_FAN</Label>
      </T>
    </>
  ),
};

/* ---------- 5. Накопитель M.2 (вид сбоку) ---------- */
const ssdTrack = (tail: Frame[]) =>
  tr([0, { x: 69, y: -40, r: -30, o: 0 }], [0.16, { o: 0 }], [0.18, { o: 1 }], [0.42, { x: 0, y: 0 }], [0.5, {}], [0.62, { r: 0 }], ...tail);

export const m2: GuideStep = {
  id: 'm2',
  title: 'Накопитель M.2',
  short: 'Накопитель M.2',
  duration: 9000,
  phases: [
    { at: 0, text: 'Выкрутите винт из стойки напротив разъёма' },
    { at: 0.16, text: 'Вставьте накопитель в разъём под углом около 30°, до упора' },
    { at: 0.5, text: 'Опустите свободный край к стойке' },
    { at: 0.64, text: 'Закрепите тем же винтом, без большого усилия' },
  ],
  tip: 'Если над слотом стоит радиатор, снимите его заранее и не забудьте плёнку на термопрокладке. Самый быстрый слот обычно ближе всего к процессору.',
  tracks: {
    screw: tr([0, {}], [0.04, {}], [0.12, { x: 40, y: -50 }], [0.15, { o: 0 }], [0.64, { o: 0 }], [0.66, { o: 1 }], [0.74, { x: 0, y: 0 }]),
    ssd: ssdTrack([[0.97, {}], [1, { o: 0 }]]),
    ssdHand: ssdTrack([[0.64, {}], [0.7, { x: 160, o: 0 }]]),
    angle: show(0.2, 0.48),
    turn: tr([0, { o: 0 }], [0.74, { o: 0, r: 0, e: 'linear' }], [0.75, { o: 1, e: 'linear' }], [0.88, { r: -330 }], [0.9, { o: 0 }]),
  },
  Art: () => (
    <>
      <BoardSide y={254} h={20} />
      <rect className="g-socket" x={58} y={222} width={46} height={32} rx={3} />
      <rect className="g-slot-key" x={98} y={228} width={6} height={10} />
      <rect className="g-gold" x={366} y={234} width={16} height={20} rx={1.5} />
      <Label x={81} y={300}>разъём M.2</Label>
      <Label x={374} y={300}>стойка</Label>

      <T t="ssd" origin={[104, 230]}>
        <rect className="g-pcb-2" x={100} y={226} width={286} height={8} rx={2} />
        <rect className="g-gold" x={100} y={226} width={16} height={8} />
        <rect className="g-chip" x={150} y={218} width={56} height={8} rx={1.5} />
        <rect className="g-chip" x={216} y={219} width={62} height={7} rx={1.5} />
        <rect className="g-chip" x={292} y={220} width={30} height={6} rx={1.5} />
      </T>
      <T t="ssdHand" origin={[104, 230]}>
        <HandAt x={378} y={228} r={-90} pose="pinch" s={0.72} />
      </T>

      <T t="angle">
        <path className="g-guide-line" d="M104 238H200" />
        <path className="g-guide-line" d="M190 238A86 86 0 0 0 178 195" />
        <Label x={208} y={210} anchor="start" tone="hl">около 30°</Label>
      </T>

      <T t="screw">
        <rect className="g-metal" x={362} y={212} width={24} height={8} rx={3} />
        <rect className="g-metal-d" x={370} y={220} width={8} height={14} />
      </T>
      <T t="turn" origin={[374, 202]}>
        <path className="g-turn" d="M392 202A18 18 0 1 1 374 184" />
        <path className="g-turn-head" d="M373 178l7 6l-8 5z" />
      </T>
    </>
  ),
};

/* ---------- 6. Плата в корпус (вид на поддон) ---------- */
const BOARD_IN: Frame[] = [
  [0, { x: 150, y: -50, r: 8, o: 0 }],
  [0.24, { o: 0 }],
  [0.26, { o: 1 }],
  [0.4, { x: 26, y: -8, r: 3 }],
  [0.52, { x: 0, y: 0, r: 0 }],
];
const holeTimes = [0.57, 0.62, 0.67, 0.72, 0.77, 0.82];

export const board: GuideStep = {
  id: 'board',
  title: 'Плата в корпус',
  short: 'Плата в корпус',
  duration: 11000,
  phases: [
    { at: 0, text: 'Проверьте стойки: под каждым отверстием платы своя, лишние уберите' },
    { at: 0.24, text: 'Заведите плату под углом, разъёмами в вырез задней стенки' },
    { at: 0.54, text: 'Прикрутите плату во все стойки, без перетяжки' },
    { at: 0.87, text: 'Провода кнопок корпуса подключите к F_PANEL по схеме из инструкции платы' },
  ],
  tip: 'Стойка там, где у платы нет отверстия, может замкнуть плату. Провода, которые пойдут за поддоном, проложите до установки платы.',
  tracks: {
    stand: windows([0.04, 0.22]),
    standRing: ring(0.06),
    board: tr(...BOARD_IN, [0.97, {}], [1, { o: 0 }]),
    boardHand: tr(...BOARD_IN, [0.54, {}], [0.6, { x: 200, o: 0 }]),
    driver: tr(
      [0, { y: -260, o: 0 }],
      [0.53, { y: -260, o: 0 }],
      [0.54, { o: 1 }],
      ...holeTimes.flatMap((t, i): Frame[] => {
        const [hx, hy] = boardHoles[i]!;
        const [x0, y0] = boardHoles[0]!;
        return [[t, { x: hx - x0, y: hy - y0 }], [t + 0.03, {}]];
      }),
      [0.89, { x: 206, y: -260, o: 0 }],
    ),
    ...Object.fromEntries(holeTimes.map((t, i) => [`s${i}`, show(t + 0.02)])),
    wires: draw(0.87, 0.95),
    panel: show(0.88),
  },
  Art: () => (
    <CaseFrame>
      {boardHoles.map(([x, y]) => (
        <circle key={`${x}${y}`} className="g-standoff" cx={x} cy={y} r={5} />
      ))}
      <T t="stand">
        {boardHoles.map(([x, y]) => (
          <circle key={`${x}${y}`} className="g-mark g-mark--ok" cx={x} cy={y} r={11} />
        ))}
        <Label x={183} y={96} tone="ok">стойки под отверстия</Label>
      </T>
      {boardHoles.map(([x, y]) => (
        <Ring key={`${x}${y}`} t="standRing" x={x} y={y} />
      ))}

      <T t="board" origin={[183, 132]}>
        <CaseBoard />
        <rect className="g-header" x={250} y={222} width={26} height={8} rx={1.5} />
      </T>
      <T t="boardHand" origin={[183, 132]}>
        <HandAt x={300} y={132} r={-90} pose="pinch" s={0.75} />
      </T>

      {boardHoles.map(([x, y], i) => (
        <T key={i} t={`s${i}`}>
          <Screw x={x} y={y} r={5} />
        </T>
      ))}

      <g data-t="wires">
        <path className="g-wire g-wire--a" d="M436 210C390 212 320 250 258 228" pathLength={1} strokeDasharray="1 1" />
        <path className="g-wire g-wire--b" d="M436 218C392 222 324 258 266 228" pathLength={1} strokeDasharray="1 1" />
      </g>
      <T t="panel">
        <Label x={263} y={258} tone="hl">F_PANEL</Label>
      </T>

      <T t="driver">
        <g transform={`translate(${boardHoles[0]![0]} ${boardHoles[0]![1]})`}>
          <Driver tilt={26} />
        </g>
      </T>
    </CaseFrame>
  ),
};

/* ---------- 7. Блок питания и кабели ---------- */
const PSU_IN: Frame[] = [[0, { x: 420, o: 0 }], [0.02, { o: 1 }], [0.18, { x: 0 }]];

export const psu: GuideStep = {
  id: 'psu',
  title: 'Блок питания',
  short: 'Блок питания',
  duration: 10000,
  phases: [
    { at: 0, text: 'Поставьте блок вентилятором вниз, если в дне корпуса есть фильтр' },
    { at: 0.24, text: 'Прикрутите его четырьмя винтами к задней стенке' },
    { at: 0.38, text: 'Длинный кабель 24-pin подключите к разъёму у правого края платы' },
    { at: 0.64, text: 'Кабель 8-pin CPU подключите к разъёму в левом верхнем углу' },
  ],
  tip: 'Пока всё не подключено, не включайте блок в розетку. У модульного блока подключайте только те кабели, что нужны.',
  tracks: {
    psu: tr(...PSU_IN, [0.97, {}], [1, { o: 0 }]),
    psuHand: tr(...PSU_IN, [0.2, {}], [0.26, { x: 220, o: 0 }]),
    screws: show(0.26),
    c24: draw(0.4, 0.6),
    r24: ring(0.6),
    l24: show(0.42),
    c8: draw(0.66, 0.86),
    r8: ring(0.86),
    l8: show(0.68),
  },
  Art: () => (
    <CaseFrame>
      <CaseBoard />
      <Cable t="c24" d="M190 248C270 248 314 228 316 180S306 118 294 112" />
      <Cable t="c8" d="M76 248C58 210 54 120 58 70S86 34 108 36" />
      <Ring t="r24" x={293} y={112} />
      <Ring t="r8" x={108} y={36} />

      <T t="psu">
        <rect className="g-psu" x={52} y={244} width={150} height={56} rx={5} />
        <rect className="g-psu-sticker" x={112} y={254} width={60} height={22} rx={3} />
        <path className="g-arrow" d="M80 256v26m-6-7l6 8l6-8" />
        <text className="g-mini-text" x={142} y={292} textAnchor="middle">вентилятор вниз</text>
      </T>
      <T t="psuHand">
        <HandAt x={204} y={272} r={-90} pose="press" s={0.72} />
      </T>
      <T t="screws">
        {[250, 262, 282, 294].map((y) => (
          <Screw key={y} x={37} y={y} r={4} />
        ))}
      </T>
      <T t="l24">
        <Label x={350} y={186} anchor="start">24-pin</Label>
      </T>
      <T t="l8">
        <Label x={124} y={30} anchor="start">8-pin CPU</Label>
      </T>
    </CaseFrame>
  ),
};

/* ---------- 8. Видеокарта (корпус на боку, вид спереди) ---------- */
const GPU_IN: Frame[] = [[0, { y: -260, o: 0 }], [0.28, { o: 0 }], [0.3, { o: 1 }], [0.42, { y: -22 }], [0.46, {}], [0.52, { y: 0 }]];

export const gpu: GuideStep = {
  id: 'gpu',
  title: 'Видеокарта',
  short: 'Видеокарта',
  duration: 10500,
  phases: [
    { at: 0, text: 'Положите корпус на бок и снимите две заглушки напротив верхнего слота x16' },
    { at: 0.18, text: 'Откройте защёлку на конце слота' },
    { at: 0.28, text: 'Опустите карту ровно в слот и нажмите на оба края до щелчка' },
    { at: 0.58, text: 'Прикрутите планку карты к корпусу' },
    { at: 0.78, text: 'Подключите питание от блока: 8-pin или 12V-2x6' },
  ],
  tip: 'Тяжёлую карту поддержите кронштейном из комплекта, чтобы она не провисала. Разъём 12V-2x6 вставляйте до конца, без перекоса.',
  tracks: {
    covers: tr([0, {}], [0.04, {}], [0.14, { y: -150, o: 0 }], [0.97, { y: -150, o: 0 }], [1, { y: 0, o: 0 }]),
    coverHand: tr([0, { y: 200, o: 0 }], [0.01, { o: 1 }], [0.04, { y: 0 }], [0.14, { y: -150 }], [0.17, { o: 0 }]),
    latch: tr([0, {}], [0.18, {}], [0.25, { r: 40 }], [0.51, {}], [0.53, { r: 0, e: 'ease-out' }]),
    card: tr(...GPU_IN, [0.97, {}], [1, { o: 0 }]),
    hands: tr(...GPU_IN, [0.55, {}], [0.62, { y: -220, o: 0 }]),
    click: ring(0.53),
    clickLabel: show(0.54, 0.66),
    driver: tr([0, { y: -240, o: 0 }], [0.58, { y: -240, o: 0 }], [0.59, { o: 1 }], [0.63, { y: 0 }], [0.72, {}], [0.76, { y: -240, o: 0 }]),
    turn: tr([0, { o: 0 }], [0.63, { o: 0, r: 0, e: 'linear' }], [0.64, { o: 1, e: 'linear' }], [0.72, { r: -300 }], [0.73, { o: 0 }]),
    gs: show(0.7),
    power: draw(0.8, 0.92),
    powerRing: ring(0.92),
    powerLabel: show(0.82),
  },
  Art: () => (
    <>
      <BoardSide y={262} />
      <rect className="g-case" x={30} y={40} width={14} height={240} rx={3} />
      <Label x={52} y={34} anchor="start">задняя стенка</Label>

      <T t="covers">
        <rect className="g-case-slot" x={44} y={150} width={10} height={96} rx={2} />
        <rect className="g-case-slot" x={44} y={150} width={22} height={8} rx={2} />
      </T>
      <T t="coverHand">
        <HandAt x={62} y={160} r={180} pose="pinch" s={0.65} />
      </T>

      <T t="card">
        <rect className="g-metal" x={44} y={146} width={10} height={100} rx={2} />
        <rect className="g-metal" x={44} y={146} width={24} height={9} rx={2} />
        <rect className="g-gpu" x={58} y={166} width={262} height={62} rx={8} />
        <rect className="g-gpu-stripe" x={58} y={184} width={262} height={5} />
        <rect className="g-pcb" x={70} y={228} width={244} height={10} />
        <rect className="g-gold" x={124} y={238} width={150} height={9} />
        <rect className="g-plug" x={278} y={158} width={28} height={8} rx={2} />
      </T>
      <rect className="g-slot-side" x={110} y={238} width={210} height={24} rx={3} />
      <T t="latch" origin={[324, 260]}>
        <rect className="g-latch" x={320} y={226} width={9} height={36} rx={2} />
      </T>
      <T t="hands">
        <HandAt x={110} y={166} r={180} pose="flat" s={0.62} />
        <HandAt x={262} y={166} r={180} pose="flat" s={0.62} />
      </T>
      <Ring t="click" x={326} y={228} />
      <T t="clickLabel">
        <Label x={360} y={226} anchor="start" tone="ok">щёлк</Label>
      </T>

      <T t="gs">
        <Screw x={61} y={150} r={4.5} />
      </T>
      <T t="turn" origin={[61, 140]}>
        <path className="g-turn" d="M79 140A18 18 0 1 1 61 122" />
        <path className="g-turn-head" d="M60 116l7 6l-8 5z" />
      </T>
      <T t="driver">
        <g transform="translate(61 146)">
          <Driver tilt={0} />
        </g>
      </T>

      <Cable t="power" d="M480 252C420 252 340 230 300 166" />
      <Ring t="powerRing" x={292} y={162} />
      <T t="powerLabel">
        <Label x={392} y={214}>питание</Label>
      </T>
    </>
  ),
};

/* ---------- 9. Первое включение и BIOS ---------- */
export const boot: GuideStep = {
  id: 'boot',
  title: 'Первое включение',
  short: 'Включение и BIOS',
  duration: 12500,
  phases: [
    { at: 0, text: 'Кабель монитора подключите к видеокарте, а не к разъёму на плате' },
    { at: 0.22, text: 'Переведите выключатель на блоке питания в положение I' },
    { at: 0.32, text: 'Нажмите кнопку питания на корпусе' },
    { at: 0.46, text: 'Сразу нажимайте Del, чтобы открыть BIOS' },
    { at: 0.68, text: 'Включите профиль XMP или EXPO: память заработает на своей частоте' },
    { at: 0.86, text: 'Сохраните настройки клавишей F10' },
  ],
  tip: 'Первый запуск после сборки может идти до минуты с чёрным экраном: плата подбирает настройки памяти. Не выключайте компьютер в это время.',
  tracks: {
    vcable: draw(0.04, 0.18),
    vring: ring(0.18),
    wrongPort: show(0.06, 0.3),
    rocker: tr([0, {}], [0.25, {}], [0.27, { y: -8, e: 'ease-out' }], [0.97, {}], [1, { y: 0 }]),
    rockerRing: ring(0.27),
    hand: tr([0, { y: 320 }], [0.32, { y: 320 }], [0.38, { y: 0 }], [0.4, { y: 4 }], [0.42, { y: 0 }], [0.48, { y: 320 }]),
    led: show(0.41),
    fan: tr([0, { r: 0, e: 'linear' }], [0.41, { r: 0, e: 'cubic-bezier(0.5, 0, 1, 1)' }], [0.5, { r: 300, e: 'linear' }], [1, { r: 2900 }]),
    post: show(0.45, 0.6),
    key: tr([0, {}], [0.48, {}], [0.49, { y: 3 }], [0.5, { y: 0 }], [0.52, { y: 3 }], [0.53, { y: 0 }], [0.55, { y: 3 }], [0.56, { y: 0 }], [0.58, { y: 3 }], [0.59, { y: 0 }]),
    bios: show(0.6),
    toggleOff: windows([0.6, 0.76]),
    toggleOn: show(0.76),
    knob: tr([0, { o: 0 }], [0.6, { o: 0 }], [0.61, { o: 1 }], [0.74, {}], [0.77, { x: 14 }], [0.97, {}], [1, { x: 0, o: 0 }]),
    speedOld: windows([0.6, 0.78]),
    speedNew: show(0.78),
    save: show(0.87),
  },
  Art: () => (
    <>
      <rect className="g-monitor" x={24} y={18} width={270} height={172} rx={10} />
      <rect className="g-screen" x={34} y={28} width={250} height={144} rx={4} />
      <rect className="g-monitor" x={150} y={190} width={18} height={16} />
      <rect className="g-monitor" x={116} y={204} width={86} height={7} rx={3} />

      <T t="post">
        <text className="g-screen-text" x={159} y={96} textAnchor="middle">
          Press DEL to enter setup
        </text>
      </T>
      <T t="bios">
        <rect className="g-bios-head" x={34} y={28} width={250} height={22} rx={4} />
        <text className="g-screen-text g-screen-text--b" x={46} y={43}>
          BIOS · Memory
        </text>
        <text className="g-screen-text" x={46} y={78}>
          XMP / EXPO
        </text>
        <text className="g-screen-text" x={46} y={108}>
          Частота памяти
        </text>
        <text className="g-screen-text g-screen-text--dim" x={46} y={156}>
          F10 Save &amp; Exit
        </text>
      </T>
      <T t="toggleOff">
        <rect className="g-toggle-off" x={226} y={66} width={34} height={18} rx={9} />
      </T>
      <T t="toggleOn">
        <rect className="g-toggle-on" x={226} y={66} width={34} height={18} rx={9} />
      </T>
      <T t="knob">
        <circle className="g-toggle-knob" cx={236} cy={75} r={6.5} />
      </T>
      <T t="speedOld">
        <text className="g-screen-text g-screen-text--dim" x={272} y={108} textAnchor="end">
          4800 MT/s
        </text>
      </T>
      <T t="speedNew">
        <text className="g-screen-text g-screen-text--ok" x={272} y={108} textAnchor="end">
          6000 MT/s
        </text>
      </T>
      <T t="save">
        <rect className="g-mark g-mark--ok" x={40} y={142} width={112} height={20} rx={4} />
      </T>

      <T t="key">
        <rect className="g-key" x={232} y={198} width={48} height={22} rx={5} />
        <text className="g-key-text" x={256} y={213} textAnchor="middle">
          Del
        </text>
      </T>

      <rect className="g-case" x={322} y={26} width={136} height={240} rx={10} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} className="g-vent" x={340} y={98 + i * 6} width={100} height={2} rx={1} />
      ))}
      <circle className="g-btn" cx={390} cy={56} r={10} />
      <T t="led">
        <circle className="g-led" cx={414} cy={56} r={3.5} />
      </T>
      <circle className="g-fanring" cx={390} cy={196} r={46} />
      <T t="fan" origin={[390, 196]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} className="g-blade" d="M390 182c10-14 26-16 32-8c-6 4-18 6-28 14z" transform={`rotate(${(360 / 7) * i} 390 196)`} />
        ))}
        <circle className="g-hub" cx={390} cy={196} r={10} />
      </T>
      <T t="hand">
        <HandAt x={392} y={58} r={-12} pose="press" s={0.8} />
      </T>

      <rect className="g-mini" x={18} y={226} width={292} height={88} rx={8} />
      <text className="g-mini-text" x={30} y={242}>
        сзади
      </text>
      <rect className="g-metal-d" x={36} y={250} width={66} height={44} rx={3} />
      <rect className="g-port" x={52} y={262} width={20} height={9} rx={2} />
      <text className="g-mini-text" x={69} y={306} textAnchor="middle">
        плата
      </text>
      <rect className="g-metal" x={118} y={254} width={150} height={22} rx={3} />
      {[0, 1, 2].map((i) => (
        <rect key={i} className="g-port" x={136 + i * 26} y={261} width={18} height={9} rx={2} />
      ))}
      <text className="g-mini-text" x={193} y={292} textAnchor="middle">
        видеокарта
      </text>
      <T t="wrongPort">
        <path className="g-x" d="M54 254l18 22M72 254l-18 22" />
      </T>
      <g data-t="vcable">
        <path className="g-wire g-wire--video" d="M60 190C60 226 145 222 145 260" pathLength={1} strokeDasharray="1 1" />
      </g>
      <Ring t="vring" x={145} y={265} />

      <rect className="g-switch" x={278} y={252} width={22} height={30} rx={3} />
      <T t="rocker">
        <rect className="g-rocker" x={282} y={264} width={14} height={14} rx={2} />
      </T>
      <Ring t="rockerRing" x={289} y={262} />
      <text className="g-mini-text" x={289} y={296} textAnchor="middle">
        I / O
      </text>
    </>
  ),
};

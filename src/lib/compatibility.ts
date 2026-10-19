import type { CategoryId, Product } from '@/data/types';
import { biosRule, chipsetsBySocket } from '@/data/platforms';

/** Slots of the builder, in display order. A build can hold two drives. */
export const buildSlots = ['cpu', 'cooling', 'motherboard', 'ram', 'storage', 'storage2', 'gpu', 'psu', 'case'] as const;
export type SlotId = (typeof buildSlots)[number];
export type Build = Partial<Record<SlotId, Product>>;
/** A build stored by product slugs (saved builds, presets, share links) */
export type BuildSlugs = Partial<Record<SlotId, string>>;

/** Category of the products a slot takes */
export const slotCategory = (slot: SlotId): CategoryId => (slot === 'storage2' ? 'storage' : slot);
/** Categories needed to show a build */
export const buildCategories: CategoryId[] = [...new Set(buildSlots.map(slotCategory))];

export const slotLabel = (slot: SlotId, singular: string) => (slot === 'storage2' ? 'Второй накопитель' : singular);

/**
 * ok — подходит; warn — подходит с оговоркой; fail — не подходит;
 * unknown — не проверено, потому что в данных нет нужного значения; pending — выбраны не все детали.
 */
export type CheckStatus = 'ok' | 'warn' | 'fail' | 'unknown' | 'pending';

export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  /** One line under the title */
  message: string;
  /** Plain-language explanation for «Подробнее» */
  details?: string;
  /** Slots this check depends on */
  slots: SlotId[];
}

const severity: Record<CheckStatus, number> = { pending: 0, ok: 1, unknown: 2, warn: 3, fail: 4 };
export const worst = (list: CheckResult[]) => list.reduce<CheckResult | null>((w, c) => (!w || severity[c.status] > severity[w.status] ? c : w), null);

const num = (p: Product | undefined, key: string): number => {
  const v = p?.specs[key];
  return typeof v === 'number' ? v : 0;
};
const str = (p: Product | undefined, key: string): string => String(p?.specs[key] ?? '');
const list = (p: Product | undefined, key: string): string[] => {
  const v = p?.specs[key];
  return Array.isArray(v) ? v : v == null ? [] : [String(v)];
};
const known = (p: Product | undefined, key: string) => p?.specs[key] !== undefined && p?.specs[key] !== null;

export function isSlot(value: string): value is SlotId {
  return (buildSlots as readonly string[]).includes(value);
}
/** Can this category be put into a build */
export const inBuild = (category: CategoryId) => isSlot(category);

/** Approximate system power draw and recommended PSU wattage, with the numbers behind it */
export function estimatePower(build: Build) {
  const cpu = num(build.cpu, 'tdp');
  const gpu = num(build.gpu, 'tdp');
  const rest = 75; // board, RAM, drives, fans, USB
  const draw = cpu + gpu + rest;
  const byMargin = Math.ceil((draw * 1.3) / 50) * 50;
  const gpuRec = num(build.gpu, 'recPsu');
  const recommended = Math.max(byMargin, gpuRec);
  const details =
    `Процессор ${cpu ? `${cpu} Вт` : '—'} + видеокарта ${gpu ? `${gpu} Вт` : '—'} + ${rest} Вт на плату, память, накопители и вентиляторы ≈ ${draw} Вт. ` +
    `Блок берут с запасом 30%, чтобы он не работал на пределе и не шумел: ${draw} × 1,3 → ${byMargin} Вт` +
    (gpuRec ? `. Производитель видеокарты советует от ${gpuRec} Вт — берём большее из двух: ${recommended} Вт.` : '.');
  return { draw, recommended, details };
}

/** Big cards (RTX 4080/4090, 5070 Ti and up…) usually take 12V-2x6 (12VHPWR) or three 8-pin plugs */
const HIGH_POWER_GPU = 285;

export function runChecks(build: Build): CheckResult[] {
  const { cpu, motherboard: mb, ram, gpu, psu, cooling } = build;
  const pcCase = build.case;
  const drives = [build.storage, build.storage2].filter((d): d is Product => !!d);
  const out: CheckResult[] = [];

  /* Processor ↔ board: socket, then BIOS */
  const cpuMb: CheckResult = {
    id: 'cpu-mb', title: 'Процессор и плата', slots: ['cpu', 'motherboard'], status: 'pending',
    message: 'Выберите процессор и плату, чтобы сравнить сокеты',
  };
  if (cpu && mb) {
    const a = str(cpu, 'socket');
    const b = str(mb, 'socket');
    if (a !== b) {
      Object.assign(cpuMb, {
        status: 'fail', message: `Разные сокеты: ${a} у процессора и ${b} у платы`,
        details: 'Сокет — разъём на плате под процессор. Он должен совпадать полностью: процессор с другим сокетом физически не встанет.',
      });
    } else {
      const rule = biosRule(a, str(mb, 'chipset'), cpu.name);
      Object.assign(cpuMb, rule
        ? { status: 'warn', message: `Сокет ${a} совпадает. ${rule.short}`, details: rule.details }
        : {
            status: 'ok', message: `Сокет ${a} совпадает${str(mb, 'chipset') ? `, чипсет ${str(mb, 'chipset')}` : ''}`,
            details: 'Сокет одинаковый, известных проблем с прошивкой у этого сочетания нет. Перед сборкой всё же загляните в список поддерживаемых процессоров на сайте производителя платы.',
          });
    }
  }
  out.push(cpuMb);

  /* Processor ↔ memory */
  const cpuRam: CheckResult = {
    id: 'cpu-ram', title: 'Процессор и память', slots: ['cpu', 'ram'], status: 'pending',
    message: 'Выберите процессор и память, чтобы проверить тип памяти',
  };
  if (cpu && ram) {
    const type = str(ram, 'memType');
    const supported = list(cpu, 'memory');
    Object.assign(cpuRam, supported.includes(type)
      ? { status: 'ok', message: `Процессор поддерживает ${type}` }
      : { status: 'fail', message: `Процессор не поддерживает ${type}, нужна ${supported.join(' или ')}`, details: 'Контроллер памяти встроен в процессор, и он работает только с определёнными поколениями DDR. Модули разных поколений отличаются вырезом и не вставляются в чужой слот.' });
  }
  out.push(cpuRam);

  /* Board ↔ memory: type and number of modules */
  const mbRam: CheckResult = {
    id: 'mb-ram', title: 'Плата и память', slots: ['motherboard', 'ram'], status: 'pending',
    message: 'Выберите плату и память, чтобы проверить слоты',
  };
  if (mb && ram) {
    const need = str(mb, 'memType');
    const has = str(ram, 'memType');
    const modules = num(ram, 'modules');
    const slots = num(mb, 'memSlots');
    if (need !== has) Object.assign(mbRam, { status: 'fail', message: `Плата рассчитана на ${need}, а память — ${has}`, details: 'Слоты платы поддерживают одно поколение памяти. DDR4 и DDR5 несовместимы ни механически, ни электрически.' });
    else if (slots && modules > slots) Object.assign(mbRam, { status: 'fail', message: `В комплекте ${modules} модуля, а на плате ${slots} слота` });
    else Object.assign(mbRam, { status: 'ok', message: `${has}${slots ? `, занято ${modules} из ${slots} слотов` : ''}` });
  }
  out.push(mbRam);

  /* Power supply: wattage */
  const power: CheckResult = {
    id: 'psu', title: 'Мощность блока питания', slots: ['psu', 'cpu', 'gpu'], status: 'pending',
    message: 'Выберите блок питания, чтобы проверить мощность',
  };
  if (psu && (cpu || gpu)) {
    const { draw, recommended, details } = estimatePower(build);
    const watt = num(psu, 'wattage');
    Object.assign(power, { details },
      watt >= recommended
        ? { status: 'ok', message: `Хватает: система ~${draw} Вт, рекомендуется от ${recommended} Вт, у блока ${watt} Вт` }
        : watt >= draw
          ? { status: 'warn', message: `Впритык: рекомендуется от ${recommended} Вт, у блока ${watt} Вт` }
          : { status: 'fail', message: `Не хватит: система ~${draw} Вт, у блока всего ${watt} Вт` });
  } else if (psu) power.message = 'Выберите процессор или видеокарту, чтобы оценить нагрузку';
  out.push(power);

  /* Power supply ↔ graphics card: connectors */
  const plugs: CheckResult = {
    id: 'psu-gpu', title: 'Разъёмы питания видеокарты', slots: ['psu', 'gpu'], status: 'pending',
    message: 'Выберите видеокарту и блок питания, чтобы проверить разъёмы',
  };
  if (psu && gpu) {
    const big = num(gpu, 'tdp') >= HIGH_POWER_GPU;
    if (!big) {
      Object.assign(plugs, {
        status: 'ok', message: 'Карте хватит обычных разъёмов 8-pin PCIe',
        details: `Карты с TDP до ~${HIGH_POWER_GPU} Вт питаются от одного–двух разъёмов 8-pin (6+2). Они есть у блоков от 550 Вт; сколько их у вашего блока, указано в его характеристиках.`,
      });
    } else if (!known(psu, 'highPower')) {
      Object.assign(plugs, {
        status: 'unknown', message: 'Не проверено: нет данных о разъёме 12V-2x6 у блока',
        details: 'Мощные карты обычно подключаются кабелем 12V-2x6 (12VHPWR) или тремя 8-pin через переходник из комплекта карты. Посмотрите в характеристиках блока, есть ли у него такой кабель.',
      });
    } else if (psu.specs.highPower) {
      Object.assign(plugs, { status: 'ok', message: 'У блока есть кабель 12V-2x6 для мощной карты' });
    } else {
      Object.assign(plugs, {
        status: 'warn', message: 'У блока нет кабеля 12V-2x6: понадобится переходник',
        details: 'Мощные карты используют разъём 12V-2x6 (12VHPWR). Переходник на 3–4 разъёма 8-pin обычно лежит в коробке карты; блок должен отдать столько 8-pin кабелей.',
      });
    }
  }
  out.push(plugs);

  /* Cooler ↔ processor: mount and cooling power */
  const coolCpu: CheckResult = {
    id: 'cooler-cpu', title: 'Кулер и процессор', slots: ['cooling', 'cpu'], status: 'pending',
    message: 'Выберите кулер и процессор, чтобы проверить крепление',
  };
  if (cooling && cpu) {
    const socket = str(cpu, 'socket');
    const tdp = num(cpu, 'tdp');
    const maxTdp = num(cooling, 'maxTdp');
    if (!list(cooling, 'sockets').includes(socket)) {
      Object.assign(coolCpu, { status: 'fail', message: `Нет крепления под ${socket}`, details: 'Кулер крепится к плате вокруг сокета. Если в комплекте нет крепления под ваш сокет, его иногда продают отдельно — уточните у производителя кулера.' });
    } else if (maxTdp) {
      Object.assign(coolCpu, maxTdp >= tdp
        ? { status: 'ok', message: `Крепление под ${socket}, рассеивает до ${maxTdp} Вт при TDP процессора ${tdp} Вт` }
        : { status: 'warn', message: `Кулер рассчитан на ${maxTdp} Вт, а TDP процессора ${tdp} Вт`, details: 'Под нагрузкой процессор будет горячим и сбросит частоты. Возьмите кулер мощнее или СЖО.' });
    } else {
      const liquid = num(cooling, 'radiator') > 0;
      const singleFan = String(cooling.specs.fans ?? '').startsWith('1 ');
      const risky = !liquid && singleFan && tdp > 125;
      Object.assign(coolCpu, {
        status: risky ? 'warn' : 'ok',
        message: risky ? `Крепление под ${socket} есть, но для ${tdp} Вт кулер с одним вентилятором слабоват` : `Крепление под ${socket} есть`,
        details: `Производитель не указал, на какое тепловыделение рассчитан кулер, поэтому мощность проверена приблизительно: процессор с TDP ${tdp} Вт${risky ? ' лучше охлаждать башней с двумя вентиляторами или СЖО' : ' такой кулер обычно охлаждает без проблем'}.`,
      });
    }
  } else if (cooling) coolCpu.message = 'Выберите процессор, чтобы проверить крепление кулера';
  out.push(coolCpu);

  /* Cooler ↔ case (and tall memory under a tower) */
  const coolCase: CheckResult = {
    id: 'cooler-case', title: 'Кулер и корпус', slots: ['cooling', 'case', 'ram'], status: 'pending',
    message: 'Выберите кулер и корпус, чтобы проверить размеры',
  };
  if (cooling && pcCase) {
    const radiator = num(cooling, 'radiator');
    const notes: string[] = [];
    let status: CheckStatus = 'ok';
    let message: string;
    if (radiator > 0) {
      const max = num(pcCase, 'maxRadiator');
      if (!max) [status, message] = ['unknown', `Не проверено: у корпуса не указан размер радиатора, а у СЖО — ${radiator} мм`];
      else if (radiator <= max) message = `Радиатор ${radiator} мм встаёт, корпус берёт до ${max} мм`;
      else [status, message] = ['fail', `Радиатор ${radiator} мм, а корпус берёт до ${max} мм`];
    } else {
      const h = num(cooling, 'height');
      const max = num(pcCase, 'maxCooler');
      if (!h || !max) [status, message] = ['unknown', 'Не проверено: не известна высота кулера или допустимая высота в корпусе'];
      else if (h <= max) message = `Высота ${h} мм проходит, в корпусе до ${max} мм`;
      else [status, message] = ['fail', `Высота кулера ${h} мм, а в корпусе помещается ${max} мм`];
      const ramH = num(ram, 'height');
      if (ram && ramH > 44 && status !== 'fail') {
        status = 'warn';
        notes.push(`Модули памяти высотой ${ramH} мм могут упереться в радиатор башни. Сверьте «зазор под память» у кулера или сдвиньте вентилятор выше.`);
      }
    }
    Object.assign(coolCase, {
      status, message,
      details: notes.join(' ') || 'Башенный кулер должен поместиться по высоте между платой и боковой крышкой, радиатор СЖО — на место для вентиляторов спереди или сверху.',
    });
  }
  out.push(coolCase);

  /* Drives ↔ board: M.2 slots */
  const drive: CheckResult = {
    id: 'storage', title: 'Накопители и слоты M.2', slots: ['storage', 'storage2', 'motherboard'], status: 'pending',
    message: 'Выберите накопитель и плату, чтобы проверить разъёмы',
  };
  if (drives.length && mb) {
    const nvme = drives.filter((d) => str(d, 'type') === 'NVMe').length;
    const slotsM2 = num(mb, 'm2');
    if (nvme === 0) Object.assign(drive, { status: 'ok', message: 'Подключается по SATA: кабель обычно в комплекте платы' });
    else if (nvme <= slotsM2) Object.assign(drive, { status: 'ok', message: `M.2: занято ${nvme} из ${slotsM2}` });
    else Object.assign(drive, {
      status: 'fail', message: slotsM2 ? `NVMe-накопителей ${nvme}, а слотов M.2 на плате ${slotsM2}` : 'На плате нет слота M.2',
      details: 'Накопитель NVMe вставляется прямо в слот M.2 на плате. Возьмите SATA-накопитель вторым диском или плату с большим числом слотов.',
    });
  }
  out.push(drive);

  /* Case ↔ board */
  const caseMb: CheckResult = {
    id: 'case-mb', title: 'Корпус и плата', slots: ['case', 'motherboard'], status: 'pending',
    message: 'Выберите корпус и плату, чтобы проверить размер',
  };
  if (pcCase && mb) {
    const form = str(mb, 'formFactor');
    Object.assign(caseMb, list(pcCase, 'boards').includes(form)
      ? { status: 'ok', message: `Плата ${form} помещается` }
      : { status: 'fail', message: `Плата ${form} не помещается: корпус берёт ${list(pcCase, 'boards').join(', ')}`, details: 'Форм-фактор — размер платы. В корпус для mATX не встанет ATX, а наоборот — можно: маленькая плата крепится в большой корпус.' });
  }
  out.push(caseMb);

  /* Case ↔ graphics card */
  const caseGpu: CheckResult = {
    id: 'case-gpu', title: 'Корпус и видеокарта', slots: ['case', 'gpu'], status: 'pending',
    message: 'Выберите корпус и видеокарту, чтобы проверить длину',
  };
  if (pcCase && gpu) {
    const length = num(gpu, 'length');
    const max = num(pcCase, 'maxGpu');
    if (!max) Object.assign(caseGpu, { status: 'unknown', message: 'Не проверено: у корпуса не указана максимальная длина видеокарты' });
    else if (!length) Object.assign(caseGpu, {
      status: 'unknown', message: `Уточните длину вашей версии карты: корпус берёт до ${max} мм`,
      details: 'Одна видеокарта (например, RTX 4070) выпускается разными производителями, и длина у версий отличается на 5–10 см. Длину нужной версии смотрите в карточке товара в магазине.',
    });
    else Object.assign(caseGpu, length <= max
      ? { status: 'ok', message: `Карта ${length} мм помещается, корпус берёт до ${max} мм` }
      : { status: 'fail', message: `Карта ${length} мм длиннее допустимых ${max} мм` });
  }
  out.push(caseGpu);

  return out;
}

/** How a candidate product would fit into the current build: the worst check that involves its slot */
export function assessCandidate(build: Build, slot: SlotId, candidate: Product): CheckResult | null {
  const next = { ...build, [slot]: candidate };
  return worst(runChecks(next).filter((c) => c.slots.includes(slot) && c.status !== 'pending'));
}

/** Text + chips for the compatibility card on the model page (server) */
export function compatSummary(product: Product, catalog: Product[]): { text: string; chips: Array<Product | string> } {
  const of = (category: CategoryId) => catalog.filter((p) => p.category === category);
  switch (product.category) {
    case 'cpu': {
      const socket = str(product, 'socket');
      return { text: `Подходят материнские платы с сокетом ${socket} на чипсетах:`, chips: chipsetsBySocket[socket] ?? [] };
    }
    case 'motherboard':
      return {
        text: `Подходят процессоры с сокетом ${str(product, 'socket')} и память ${str(product, 'memType')}. Процессоры в каталоге:`,
        chips: of('cpu').filter((c) => str(c, 'socket') === str(product, 'socket')).slice(0, 8),
      };
    case 'ram':
      return {
        text: `Нужна материнская плата со слотами ${str(product, 'memType')}. Платы в каталоге:`,
        chips: of('motherboard').filter((m) => str(m, 'memType') === str(product, 'memType')).slice(0, 8),
      };
    case 'gpu':
      return {
        text: num(product, 'length')
          ? `Рекомендуемый блок питания — от ${num(product, 'recPsu')} Вт, корпус — для карт длиной от ${num(product, 'length')} мм. Подходящие блоки:`
          : `Рекомендуемый блок питания — от ${num(product, 'recPsu')} Вт. Длина зависит от версии карты, сверьте её с корпусом. Подходящие блоки:`,
        chips: of('psu').filter((p) => num(p, 'wattage') >= num(product, 'recPsu')).slice(0, 8),
      };
    case 'psu':
      return {
        text: `Хватит для видеокарт с рекомендуемым БП до ${num(product, 'wattage')} Вт, например:`,
        chips: of('gpu').filter((g) => num(g, 'recPsu') <= num(product, 'wattage')).slice(0, 8),
      };
    case 'storage':
      return str(product, 'type') === 'SATA'
        ? { text: 'Подключается к порту SATA — он есть почти на всех платах.', chips: [] }
        : {
            text: `Нужен слот M.2 2280. ${str(product, 'iface').startsWith('PCIe 5.0') ? 'Полная скорость — только в слоте PCIe 5.0.' : 'Подойдёт любая плата со слотом M.2:'}`,
            chips: of('motherboard').filter((m) => num(m, 'm2') > 0).slice(0, 5),
          };
    case 'cooling':
      return { text: 'Совместим с сокетами:', chips: list(product, 'sockets') };
    case 'case':
      return { text: 'Поддерживаемые форм-факторы материнских плат:', chips: list(product, 'boards') };
  }
}

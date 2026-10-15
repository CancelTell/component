import type { CategoryId, Product } from '@/data/types';
import { chipsetsBySocket } from '@/data';

/** Slots of the compatibility builder, in display order */
export const buildSlots = ['cpu', 'motherboard', 'ram', 'gpu', 'psu', 'case'] as const;
export type SlotId = (typeof buildSlots)[number];
export type Build = Partial<Record<SlotId, Product>>;

export type CheckStatus = 'ok' | 'warn' | 'fail' | 'pending';

export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  message: string;
  /** Slots this check depends on */
  slots: SlotId[];
}

const num = (p: Product | undefined, key: string): number => {
  const v = p?.specs[key];
  return typeof v === 'number' ? v : 0;
};
const str = (p: Product | undefined, key: string): string => String(p?.specs[key] ?? '');
const list = (p: Product | undefined, key: string): string[] => {
  const v = p?.specs[key];
  return Array.isArray(v) ? v : v == null ? [] : [String(v)];
};

export function isSlot(category: CategoryId): category is SlotId {
  return (buildSlots as readonly string[]).includes(category);
}

/** Approximate system power draw and recommended PSU wattage */
export function estimatePower(build: Build) {
  const draw = num(build.cpu, 'tdp') + num(build.gpu, 'tdp') + 75; // board, RAM, drives, fans
  const byMargin = Math.ceil((draw * 1.3) / 50) * 50;
  const recommended = Math.max(byMargin, num(build.gpu, 'recPsu'));
  return { draw, recommended };
}

export function runChecks(build: Build): CheckResult[] {
  const { cpu, motherboard: mb, ram, gpu, psu } = build;
  const pcCase = build.case;

  const cpuMb: CheckResult = { id: 'cpu-mb', title: 'Процессор и плата', slots: ['cpu', 'motherboard'], status: 'pending', message: 'Выберите процессор и плату, чтобы сравнить сокеты' };
  if (cpu && mb) {
    const a = str(cpu, 'socket');
    const b = str(mb, 'socket');
    Object.assign(cpuMb, a === b
      ? { status: 'ok', message: `Сокет ${a} совпадает` }
      : { status: 'fail', message: `Разные сокеты: ${a} у процессора и ${b} у платы` });
  }

  const cpuRam: CheckResult = { id: 'cpu-ram', title: 'Процессор и память', slots: ['cpu', 'ram'], status: 'pending', message: 'Выберите процессор и память, чтобы проверить тип памяти' };
  if (cpu && ram) {
    const type = str(ram, 'memType');
    Object.assign(cpuRam, list(cpu, 'memory').includes(type)
      ? { status: 'ok', message: `Процессор поддерживает ${type}` }
      : { status: 'fail', message: `Процессор не поддерживает ${type}, нужна ${list(cpu, 'memory').join(' или ')}` });
  }

  const mbRam: CheckResult = { id: 'mb-ram', title: 'Плата и память', slots: ['motherboard', 'ram'], status: 'pending', message: 'Выберите плату и память, чтобы проверить слоты' };
  if (mb && ram) {
    const need = str(mb, 'memType');
    const has = str(ram, 'memType');
    Object.assign(mbRam, need === has
      ? { status: 'ok', message: `Плата поддерживает ${has}` }
      : { status: 'fail', message: `Плата рассчитана на ${need}, а память — ${has}` });
  }

  const power: CheckResult = { id: 'psu', title: 'Блок питания', slots: ['psu', 'cpu', 'gpu'], status: 'pending', message: 'Выберите блок питания, чтобы проверить мощность' };
  if (psu && (cpu || gpu)) {
    const { draw, recommended } = estimatePower(build);
    const watt = num(psu, 'wattage');
    if (watt >= recommended) {
      Object.assign(power, { status: 'ok', message: `Мощности хватает: система ~${draw} Вт, блок ${watt} Вт` });
    } else if (watt >= draw) {
      Object.assign(power, { status: 'warn', message: `Впритык: рекомендуется от ${recommended} Вт, у блока ${watt} Вт` });
    } else {
      Object.assign(power, { status: 'fail', message: `Не хватит: система ~${draw} Вт, блок всего ${watt} Вт` });
    }
  } else if (psu) {
    power.message = 'Выберите процессор или видеокарту, чтобы оценить нагрузку';
  }

  const caseFit: CheckResult = { id: 'case', title: 'Корпус', slots: ['case', 'motherboard', 'gpu'], status: 'pending', message: 'Выберите корпус, чтобы проверить размер платы' };
  if (pcCase && (mb || gpu)) {
    const problems: string[] = [];
    const fits: string[] = [];
    if (mb) {
      const form = str(mb, 'formFactor');
      if (list(pcCase, 'boards').includes(form)) fits.push(`плата ${form}`);
      else problems.push(`плата ${form} не помещается`);
    }
    if (gpu) {
      const length = num(gpu, 'length');
      const max = num(pcCase, 'maxGpu');
      if (length <= max) fits.push(`видеокарта ${length} мм`);
      else problems.push(`видеокарта ${length} мм длиннее допустимых ${max} мм`);
    }
    const text = problems.length ? problems.join(', ') : `${fits.join(' и ')} помещаются`;
    Object.assign(caseFit, {
      status: problems.length ? 'fail' : 'ok',
      message: text.charAt(0).toUpperCase() + text.slice(1),
    });
  } else if (pcCase) {
    caseFit.message = 'Выберите плату или видеокарту, чтобы проверить размеры';
  }

  return [cpuMb, cpuRam, mbRam, power, caseFit];
}

/** How a candidate product would fit into the current build */
export function assessCandidate(build: Build, slot: SlotId, candidate: Product): CheckResult | null {
  const results = runChecks({ ...build, [slot]: candidate }).filter((c) => c.slots.includes(slot));
  return (
    results.find((c) => c.status === 'fail') ??
    results.find((c) => c.status === 'warn') ??
    results.find((c) => c.status === 'ok') ??
    null
  );
}

/** Text + chips for the compatibility card on the model page */
export function compatSummary(product: Product, catalog: Product[]): { text: string; chips: Array<Product | string> } {
  const of = (category: CategoryId) => catalog.filter((p) => p.category === category);
  switch (product.category) {
    case 'cpu': {
      const socket = str(product, 'socket');
      return { text: `Подходят материнские платы с сокетом ${socket} на чипсетах:`, chips: chipsetsBySocket[socket] ?? [] };
    }
    case 'motherboard':
      return {
        text: `Подходят процессоры с сокетом ${str(product, 'socket')} и память ${str(product, 'memType')}. Процессоры в справочнике:`,
        chips: of('cpu').filter((c) => str(c, 'socket') === str(product, 'socket')),
      };
    case 'ram':
      return {
        text: `Нужна материнская плата со слотами ${str(product, 'memType')}. Платы в справочнике:`,
        chips: of('motherboard').filter((m) => str(m, 'memType') === str(product, 'memType')),
      };
    case 'gpu':
      return {
        text: `Рекомендуемый блок питания — от ${num(product, 'recPsu')} Вт, корпус — для карт длиной от ${num(product, 'length')} мм. Подходящие блоки:`,
        chips: of('psu').filter((p) => num(p, 'wattage') >= num(product, 'recPsu')),
      };
    case 'psu':
      return {
        text: `Хватит для видеокарт с рекомендуемым БП до ${num(product, 'wattage')} Вт:`,
        chips: of('gpu').filter((g) => num(g, 'recPsu') <= num(product, 'wattage')),
      };
    case 'storage':
      return str(product, 'type') === 'SATA'
        ? { text: 'Подключается к порту SATA — он есть на всех платах в справочнике.', chips: [] }
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

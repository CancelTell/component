/*
  Turns specs from any source into the site's format (the keys from src/data/categories.ts).
  Each rule matches a parameter by name — English (Icecat) and Russian (store feeds) —
  and parses the value. Unknown parameters are collected for the report, so new rules are easy to add.
*/
import type { CategoryId, SpecValue, Specs } from '../../src/data/types';
import type { Param } from './sources';

/* ---------- category ---------- */

// Order matters: "Кулеры для процессоров" must be cooling, not cpu
const CATEGORY_RULES: Array<[CategoryId, RegExp]> = [
  ['cooling', /кулер|охлажден|cooler|liquid cooling/i],
  ['gpu', /видеокарт|graphics card|video card/i],
  ['motherboard', /материнск|motherboard/i],
  ['cpu', /^процессор|^processors?\b|^cpus?\b/i],
  ['ram', /оперативн|memory module|^ram|модули памяти/i],
  ['storage', /ssd|накопител|solid state|жестк/i],
  ['psu', /блок.? питания|power suppl/i],
  ['case', /корпус|computer case|pc case|chassis/i],
];

export function categoryOf(text: string): CategoryId | null {
  // "Комплектующие / Процессоры": the last segment is the most specific
  const parts = text.split('/').map((s) => s.trim()).reverse();
  for (const part of parts) {
    for (const [id, re] of CATEGORY_RULES) if (re.test(part)) return id;
  }
  return null;
}

/* ---------- value parsers ---------- */

const firstNum = (v: string): number | null => {
  const m = v.replace(/\s(?=\d{3}\b)/g, '').match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
};
const num = (v: string) => firstNum(v);
/** "4200 MHz" or "4.2 GHz" → 4.2 */
const ghz = (v: string) => {
  const n = firstNum(v);
  if (n === null) return null;
  return /mhz|мгц/i.test(v) || n > 100 ? Math.round(n / 10) / 100 : n;
};
/** "2 TB" / "2000 GB" → GB */
const gb = (v: string) => {
  const n = firstNum(v);
  if (n === null) return null;
  return /tb|тб/i.test(v) ? Math.round(n * 1000) : n;
};
const mm = (v: string) => {
  const n = firstNum(v);
  if (n === null) return null;
  return /cm|см/i.test(v) ? Math.round(n * 10) : Math.round(n);
};
const yes = (v: string) => /^(yes|да|есть|true|y)\b/i.test(v.trim());
const text = (v: string) => v.trim();

export function socketOf(v: string): string | null {
  const s = v.toUpperCase().replace(/\s+/g, '');
  const m = s.match(/AM5|AM4|LGA\d{4}|FCLGA\d{4}|SP\d|TR\d|STRX\d/);
  if (!m) return null;
  return m[0].replace(/^FC/, '');
}
const sockets = (v: string) => {
  const found = v.split(/[,;/]|\s{2,}|\bи\b/).map(socketOf).filter((x): x is string => !!x);
  // LGA1700 coolers also fit LGA1851: same mounting holes
  return [...new Set(found)];
};
const memType = (v: string) => v.toUpperCase().match(/DDR\d/)?.[0] ?? null;
const memTypes = (v: string) => [...new Set(v.toUpperCase().match(/DDR\d/g) ?? [])];
const gddr = (v: string) => v.toUpperCase().match(/GDDR\d X?|GDDR\dX?|HBM\d?/)?.[0]?.replace(' ', '') ?? null;

export function formFactorOf(v: string): string | null {
  const s = v.toLowerCase().replace(/[\s-]/g, '');
  if (/eatx|extendedatx/.test(s)) return 'E-ATX';
  if (/miniitx|mitx/.test(s)) return 'Mini-ITX';
  if (/microatx|matx|μatx|uatx/.test(s)) return 'mATX';
  if (/atx/.test(s)) return 'ATX';
  return null;
}
const boardsList = (v: string) => {
  const found = v.split(/[,;/]|\s+и\s+/).map(formFactorOf).filter((x): x is string => !!x);
  return [...new Set(found)];
};
const pcieGen = (v: string) => v.match(/(\d)\.0/)?.[0] ?? null;
const chipsetOf = (v: string) => v.toUpperCase().match(/[ABHXZW]\d{3}[A-Z]?E?/)?.[0] ?? null;

/* ---------- rules per category ---------- */

type Parser = (v: string) => SpecValue | null;
type Rule = [key: string, name: RegExp, parse: Parser];

const RULES: Record<CategoryId, Rule[]> = {
  cpu: [
    ['socket', /socket|сокет|разъ[её]м процессора/i, socketOf],
    ['cores', /^(processor cores|number of cores|количество (ядер|производительных ядер)|ядер)/i, num],
    ['threads', /threads|потоков/i, num],
    ['baseClock', /base (frequency|clock)|базовая частота/i, ghz],
    ['boostClock', /boost (frequency|clock)|turbo|максимальная частота/i, ghz],
    ['l3', /(l3|smart|processor) cache|кэш l3|объем кэша l3/i, num],
    ['tdp', /tdp|thermal design|тепловыделение|базовая мощность/i, num],
    ['memory', /memory types? supported|тип памяти|поддерживаемая память/i, memTypes],
    ['channels', /memory channels|каналов памяти/i, num],
    ['igpu', /(integrated|on-board) graphics adapter model|встроенн(ое|ая) графи/i, text],
    ['unlocked', /unlocked|разблокирован/i, yes],
    ['arch', /microarchitecture|codename|архитектура|ядро$/i, text],
    ['pcie', /pci express (version|revision)|версия pci/i, pcieGen],
  ],
  gpu: [
    ['vram', /(discrete graphics adapter|graphics) memory$|объ[её]м видеопамяти|memory size/i, gb],
    ['memType', /memory type|тип видеопамяти|тип памяти/i, gddr],
    ['bus', /memory bus|разрядность/i, num],
    ['tdp', /power consumption|энергопотребление|tdp|потребляемая мощность/i, num],
    ['recPsu', /minimum system power|recommended psu|рекомендуемая мощность|минимальная мощность блока/i, num],
    ['length', /^(length|depth|card length)$|длина видеокарты|^длина/i, mm],
    ['pcie', /interface|интерфейс подключения/i, (v) => v.match(/\d\.0(\s*x\d+)?/)?.[0] ?? null],
  ],
  motherboard: [
    ['socket', /processor socket|socket|сокет/i, socketOf],
    ['chipset', /chipset|чипсет/i, chipsetOf],
    ['formFactor', /form factor|форм-фактор/i, formFactorOf],
    ['memType', /supported memory types|memory types?|тип (поддерживаемой )?памяти/i, memType],
    ['memSlots', /memory slots|слотов памяти|количество слотов (оперативной )?памяти/i, num],
    ['maxMem', /maximum internal memory|максимальный объем памяти/i, gb],
    ['m2', /m\.2.*(slots|разъ[её]м)|разъ[её]мов m\.2|количество m\.2/i, num],
    ['pcieGpu', /pci express x16 .*version|версия pci-?e x16/i, pcieGen],
    ['wifi', /wi-?fi standards|wlan|wi-?fi/i, (v) => (/7|be/i.test(v) ? 'Wi-Fi 7' : /6e/i.test(v) ? 'Wi-Fi 6E' : /6|ax/i.test(v) ? 'Wi-Fi 6' : /^(no|нет)/i.test(v) ? null : v.trim())],
  ],
  ram: [
    ['memType', /internal memory type|memory type|тип памяти/i, memType],
    ['modules', /memory layout|количество модулей|модулей в комплекте/i, (v) => num(v.match(/(\d+)\s*[x×]/)?.[1] ?? v)],
    ['moduleSize', /memory layout|объ[её]м одного модуля/i, (v) => num(v.match(/[x×]\s*(\d+)/)?.[1] ?? v)],
    ['speed', /memory clock speed|тактовая частота|частота/i, num],
    ['cl', /cas latency|латентность|cl$/i, num],
    ['voltage', /voltage|напряжение/i, num],
  ],
  storage: [
    ['type', /nvme|interface|интерфейс/i, (v) => (/nvme|pci/i.test(v) ? 'NVMe' : /sata/i.test(v) ? 'SATA' : null)],
    ['formFactor', /form factor|форм-фактор/i, (v) => (/2280/.test(v) ? 'M.2 2280' : /m\.2/i.test(v) ? 'M.2 2280' : /2[.,]5/.test(v) ? '2,5"' : v.trim())],
    ['iface', /^interface|интерфейс/i, (v) => (v.match(/(\d\.0)\s*x\s*(\d)/) ? `PCIe ${v.match(/(\d\.0)/)![1]} x4` : /sata/i.test(v) ? 'SATA III' : v.trim())],
    ['capacity', /ssd capacity|capacity|объ[её]м накопителя|^объ[её]м/i, gb],
    ['read', /read speed|скорость (последовательного )?чтения/i, num],
    ['write', /write speed|скорость (последовательной )?записи/i, num],
    ['tbw', /tbw|total bytes written|ресурс/i, num],
  ],
  psu: [
    ['wattage', /total power|power$|мощность/i, num],
    ['cert', /80 plus|сертификат/i, (v) => (v.match(/titanium|platinum|gold|silver|bronze|white/i) ? `80 PLUS ${v.match(/titanium|platinum|gold|silver|bronze|white/i)![0].replace(/^./, (c) => c.toUpperCase())}` : null)],
    ['modular', /modular|модульн/i, (v) => (/full|полност|yes|да/i.test(v) ? 'Полностью модульный' : /semi|частич/i.test(v) ? 'Частично модульный' : 'Немодульный')],
    ['atx3', /atx 3|atx3/i, yes],
    ['fan', /fan diameter|диаметр вентилятора/i, num],
  ],
  cooling: [
    ['sockets', /socket|сокет/i, sockets],
    ['height', /^height|высота/i, mm],
    ['radiator', /radiator (size|length)|размер радиатора|длина радиатора/i, mm],
    ['type', /type|тип$/i, (v) => (/liquid|жидк|сжо|aio/i.test(v) ? 'СЖО' : /tower|башн/i.test(v) ? 'Башенный' : null)],
    ['fans', /number of fans|количество вентиляторов/i, (v) => `${num(v) ?? 1} × вентилятор`],
  ],
  case: [
    ['size', /form factor|типоразмер|^type$/i, (v) => (/full/i.test(v) ? 'Full Tower' : /mid|midi/i.test(v) ? 'Mid Tower' : /mini|micro/i.test(v) ? 'Mini Tower' : v.trim())],
    ['boards', /supported motherboard form factors|форм-фактор (совместимых )?плат|поддерживаемые платы/i, boardsList],
    ['maxGpu', /maximum (graphics|video) card length|максимальная длина видеокарты/i, mm],
    ['maxCooler', /maximum (cpu )?cooler height|максимальная высота (процессорного )?кулера/i, mm],
    ['maxRadiator', /(maximum )?radiator|радиатор/i, (v) => Math.max(0, ...(v.match(/\d{3}/g) ?? []).map(Number)) || null],
    ['fansIncluded', /fans included|вентиляторов в комплекте|предустановленных вентиляторов/i, num],
  ],
};

/** Specs from a list of parameters; the first match per key wins, so pass sources in priority order */
export function extractSpecs(category: CategoryId, params: Param[], unknown?: Map<string, number>): Specs {
  const specs: Specs = {};
  for (const p of params) {
    const value = p.unit && !p.value.includes(p.unit) ? `${p.value} ${p.unit}` : p.value;
    let used = false;
    for (const [key, re, parse] of RULES[category]) {
      if (re.test(p.name)) {
        used = true;
        if (specs[key] !== undefined && specs[key] !== null) continue;
        const parsed = parse(value);
        if (parsed !== null && !(Array.isArray(parsed) && parsed.length === 0)) specs[key] = parsed;
      }
    }
    if (!used && unknown) unknown.set(`${category}: ${p.name}`, (unknown.get(`${category}: ${p.name}`) ?? 0) + 1);
  }
  // Derived values
  if (category === 'gpu' && specs.tdp && !specs.recPsu) specs.recPsu = Math.ceil(((Number(specs.tdp) + 250) * 1.2) / 50) * 50;
  if (category === 'cooling' && !specs.radiator && specs.type !== 'СЖО') specs.radiator = null;
  return specs;
}

/** Fields the compatibility checks depend on. Without them a model is not published. */
export const REQUIRED: Record<CategoryId, Array<string | string[]>> = {
  cpu: ['socket', 'memory', 'tdp'],
  motherboard: ['socket', 'memType', 'formFactor'],
  ram: ['memType'],
  // Card length depends on the partner version; the case check says when it's unknown
  gpu: ['tdp'],
  psu: ['wattage'],
  cooling: ['sockets', ['height', 'radiator']],
  case: ['boards', 'maxGpu'],
  storage: ['type'],
};

export function missingFields(category: CategoryId, specs: Specs): string[] {
  const has = (k: string) => specs[k] !== undefined && specs[k] !== null && !(Array.isArray(specs[k]) && (specs[k] as unknown[]).length === 0);
  return REQUIRED[category].flatMap((req) => (Array.isArray(req) ? (req.some(has) ? [] : [req.join(' или ')]) : has(req) ? [] : [req]));
}

/* ---------- names ---------- */

// \b does not work with Cyrillic in JS, so word boundaries are spelled out
const NOISE = /(?<![\p{L}\d])(процессор|видеокарта|материнская плата|оперативная память|модуль памяти|комплект памяти|ssd-?накопитель|ssd накопитель|твердотельный накопитель|накопитель|блок питания|кулер для процессора|система (жидкостного )?охлаждения|кулер|корпус|oem|box|bulk|retail|ч[её]рный|белый|black|white)(?![\p{L}\d])/giu;

/** "Процессор AMD Ryzen 7 7800X3D OEM" → "Ryzen 7 7800X3D" */
export function cleanName(title: string, brand: string): string {
  let name = title.replace(NOISE, ' ');
  if (brand) name = name.replace(new RegExp(`(?<![\\p{L}\\d])${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\d])`, 'iu'), ' ');
  return name
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Graphics chip as the catalog key for video cards: partner cards of one chip merge into one model */
export function gpuChip(text: string): { brand: string; name: string } | null {
  const t = text.replace(/\s+/g, ' ');
  const nv = t.match(/RTX\s?(\d{4})(\s?Ti)?(\s?SUPER)?/i);
  if (nv) return { brand: 'NVIDIA', name: `GeForce RTX ${nv[1]}${nv[2] ? ' Ti' : ''}${nv[3] ? ' SUPER' : ''}` };
  const amd = t.match(/RX\s?(\d{4})(\s?XTX|\s?XT|\s?GRE)?/i);
  if (amd) return { brand: 'AMD', name: `Radeon RX ${amd[1]}${amd[2] ? ` ${amd[2].trim().toUpperCase()}` : ''}` };
  const arc = t.match(/Arc\s?([AB]\d{3})/i);
  if (arc) return { brand: 'Intel', name: `Arc ${arc[1]!.toUpperCase()}` };
  return null;
}

/**
 * Consistent names where one series has many versions:
 * memory → "FURY Beast DDR5-6000 CL30 2×16 ГБ", storage → "990 PRO 2 ТБ".
 * Without this "990 PRO 1 TB" and "990 PRO 2 TB" would collapse into one model.
 */
export function canonicalName(category: CategoryId, name: string, specs: Specs): string {
  const strip = (t: string) =>
    t
      .replace(/\b\d+\s*[x×]\s*\d+\s*(gb|гб)?/gi, ' ')
      .replace(/\b\d+([.,]\d+)?\s*(gb|гб|tb|тб)\b/gi, ' ')
      .replace(/\bddr\d(-\d{4})?\b|\b\d{4}\s*(mhz|мгц|mt\/s)\b|\bcl\s?\d+\b|\bm\.2\b|\bnvme\b|\bpci(e| express)\s*\d(\.0)?\b|\bsata( iii)?\b|\b2280\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  if (category === 'ram' && specs.memType && specs.speed && specs.modules && specs.moduleSize) {
    // Same series and speed often come with different timings: CL is part of the name
    const cl = specs.cl ? ` CL${specs.cl}` : '';
    return `${strip(name)} ${specs.memType}-${specs.speed}${cl} ${specs.modules}×${specs.moduleSize} ГБ`.trim();
  }
  if (category === 'storage' && typeof specs.capacity === 'number') {
    const cap = specs.capacity >= 1000 ? `${String(specs.capacity / 1000).replace('.', ',')} ТБ` : `${specs.capacity} ГБ`;
    return `${strip(name)} ${cap}`.trim();
  }
  return name;
}

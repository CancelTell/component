import type { CategoryConfig, CategoryId, FilterOption, Product, SpecValue } from './types';

const n = (p: Product, key: string): number => {
  const v = p.specs[key];
  return typeof v === 'number' ? v : NaN;
};
const s = (p: Product, key: string): string => String(p.specs[key] ?? '');
const list = (p: Product, key: string): string[] => {
  const v = p.specs[key];
  return Array.isArray(v) ? v : v == null ? [] : [String(v)];
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const eq = (key: string, value: string, label = value, id = slugify(value)): FilterOption => ({
  id,
  label,
  test: (p) => list(p, key).includes(value),
});
const brand = (value: string): FilterOption => ({
  id: slugify(value),
  label: value,
  test: (p) => p.brand === value,
});
const range = (id: string, label: string, key: string, min = -Infinity, max = Infinity): FilterOption => ({
  id,
  label,
  test: (p) => n(p, key) >= min && n(p, key) <= max,
});

// null/undefined = unknown (imported models): show a dash instead of guessing
const yesNo = (yes: string, no: string) => (v: SpecValue) => (v === null || v === undefined ? '—' : v ? yes : no);

export const categories: CategoryConfig[] = [
  {
    id: 'cpu',
    name: 'Процессоры',
    singular: 'Процессор',
    navLabel: 'Процессоры',
    description: 'Процессоры AMD и Intel: сокет, ядра, частоты, кэш и тепловыделение.',
    tagline: 'Ядра, частоты и сокеты',
    icon: 'cpu',
    meta: (p) => [p.brand, s(p, 'socket')],
    cardSpecs: ['coresThreads', 'boostClock', 'tdp'],
    keySpecs: ['coresThreads', 'boostClock', 'l3', 'tdp'],
    groups: [
      {
        title: 'Основное',
        specs: [
          { key: 'socket', label: 'Сокет' },
          { key: 'arch', label: 'Архитектура' },
          { key: 'year', label: 'Год выхода', get: (p) => p.year || null, better: 'higher' },
          { key: 'unlocked', label: 'Разгон', format: yesNo('Множитель разблокирован', 'Множитель заблокирован') },
        ],
      },
      {
        title: 'Ядра и частоты',
        specs: [
          {
            key: 'coresThreads', label: 'Ядра / потоки', mono: true, better: 'higher',
            get: (p) => `${n(p, 'cores')} / ${n(p, 'threads')}`,
            rank: (p) => n(p, 'cores') * 100 + n(p, 'threads'),
          },
          { key: 'baseClock', label: 'Базовая частота', unit: 'ГГц', decimals: 1, mono: true, better: 'higher' },
          { key: 'boostClock', label: 'Макс. частота', short: 'Частота до', unit: 'ГГц', decimals: 1, mono: true, better: 'higher' },
          { key: 'l3', label: 'Кэш L3', unit: 'МБ', mono: true, better: 'higher' },
          { key: 'tdp', label: 'TDP', unit: 'Вт', mono: true, better: 'lower' },
        ],
      },
      {
        title: 'Память и интерфейсы',
        specs: [
          { key: 'memory', label: 'Тип памяти' },
          { key: 'channels', label: 'Каналы' },
          { key: 'pcie', label: 'PCI Express', better: 'higher', rank: (p) => parseFloat(s(p, 'pcie')) },
          { key: 'igpu', label: 'Встроенная графика', format: (v) => (v ? String(v) : 'Нет') },
        ],
      },
    ],
    filters: [
      { id: 'brand', label: 'Бренд', options: [brand('AMD'), brand('Intel')] },
      { id: 'socket', label: 'Сокет', options: [eq('socket', 'AM4'), eq('socket', 'AM5'), eq('socket', 'LGA1700')] },
      {
        id: 'cores', label: 'Ядра',
        options: [range('6', '6', 'cores', 6, 6), range('8', '8', 'cores', 8, 8), range('10', '10 и больше', 'cores', 10)],
      },
      {
        id: 'tdp', label: 'TDP',
        options: [
          range('low', 'до 65 Вт', 'tdp', 0, 65),
          range('mid', '66–125 Вт', 'tdp', 66, 125),
          range('high', 'больше 125 Вт', 'tdp', 126),
        ],
      },
    ],
    quickFilters: [['brand', 'intel'], ['brand', 'amd'], ['socket', 'am4'], ['socket', 'am5'], ['socket', 'lga1700']],
  },
  {
    id: 'gpu',
    name: 'Видеокарты',
    singular: 'Видеокарта',
    navLabel: 'Видеокарты',
    description: 'Видеокарты NVIDIA, AMD и Intel: память, шина, энергопотребление и размеры.',
    tagline: 'Память, шина и питание',
    icon: 'gpu',
    meta: (p) => [p.brand, s(p, 'memType')],
    cardSpecs: ['vram', 'bus', 'tdp'],
    keySpecs: ['vram', 'bus', 'tdp', 'recPsu'],
    groups: [
      {
        title: 'Основное',
        specs: [
          { key: 'year', label: 'Год выхода', get: (p) => p.year || null, better: 'higher' },
          { key: 'pcie', label: 'Интерфейс', format: (v) => `PCIe ${v}` },
        ],
      },
      {
        title: 'Память',
        specs: [
          { key: 'vram', label: 'Видеопамять', short: 'Память', unit: 'ГБ', mono: true, better: 'higher' },
          { key: 'memType', label: 'Тип памяти' },
          { key: 'bus', label: 'Шина памяти', short: 'Шина', unit: 'бит', mono: true, better: 'higher' },
        ],
      },
      {
        title: 'Питание и размеры',
        specs: [
          { key: 'tdp', label: 'TDP', unit: 'Вт', mono: true, better: 'lower' },
          { key: 'recPsu', label: 'Рекомендуемый БП', short: 'БП от', unit: 'Вт', mono: true, better: 'lower' },
          { key: 'length', label: 'Длина (эталонная)', unit: 'мм', mono: true, better: 'lower' },
        ],
      },
    ],
    filters: [
      { id: 'brand', label: 'Бренд', options: [brand('NVIDIA'), brand('AMD'), brand('Intel')] },
      {
        id: 'vram', label: 'Видеопамять',
        options: [range('8', '8 ГБ', 'vram', 8, 8), range('12', '12 ГБ', 'vram', 12, 12), range('16', '16 ГБ и больше', 'vram', 16)],
      },
      {
        id: 'tdp', label: 'TDP',
        options: [range('low', 'до 200 Вт', 'tdp', 0, 200), range('mid', '201–260 Вт', 'tdp', 201, 260), range('high', 'больше 260 Вт', 'tdp', 261)],
      },
    ],
    quickFilters: [['brand', 'nvidia'], ['brand', 'amd'], ['brand', 'intel'], ['vram', '8'], ['vram', '12'], ['vram', '16']],
  },
  {
    id: 'motherboard',
    name: 'Материнские платы',
    singular: 'Материнская плата',
    navLabel: 'Материнские платы',
    description: 'Материнские платы для AMD и Intel: сокет, чипсет, форм-фактор и слоты.',
    tagline: 'Сокеты, чипсеты, форм-факторы',
    icon: 'motherboard',
    meta: (p) => [p.brand, s(p, 'socket'), s(p, 'formFactor')],
    cardSpecs: ['chipset', 'memType', 'm2'],
    keySpecs: ['socket', 'chipset', 'formFactor', 'memType'],
    summarySpecs: ['socket', 'formFactor', 'memType'],
    groups: [
      {
        title: 'Основное',
        specs: [
          { key: 'socket', label: 'Сокет' },
          { key: 'chipset', label: 'Чипсет' },
          { key: 'formFactor', label: 'Форм-фактор' },
          { key: 'year', label: 'Год выхода', get: (p) => p.year || null, better: 'higher' },
        ],
      },
      {
        title: 'Память',
        specs: [
          { key: 'memType', label: 'Тип памяти' },
          { key: 'memSlots', label: 'Слоты памяти', better: 'higher' },
          { key: 'maxMem', label: 'Макс. объём', unit: 'ГБ', mono: true, better: 'higher' },
        ],
      },
      {
        title: 'Интерфейсы',
        specs: [
          { key: 'pcieGpu', label: 'PCIe для видеокарты', better: 'higher', rank: (p) => parseFloat(s(p, 'pcieGpu')) },
          { key: 'm2', label: 'Слоты M.2', short: 'M.2', better: 'higher' },
          { key: 'wifi', label: 'Беспроводная сеть', format: (v) => (v ? String(v) : 'Нет') },
        ],
      },
    ],
    filters: [
      { id: 'socket', label: 'Сокет', options: [eq('socket', 'AM4'), eq('socket', 'AM5'), eq('socket', 'LGA1700')] },
      { id: 'form', label: 'Форм-фактор', options: [eq('formFactor', 'ATX'), eq('formFactor', 'mATX')] },
      { id: 'mem', label: 'Память', options: [eq('memType', 'DDR4'), eq('memType', 'DDR5')] },
    ],
    quickFilters: [['socket', 'am4'], ['socket', 'am5'], ['socket', 'lga1700'], ['form', 'atx'], ['form', 'matx']],
  },
  {
    id: 'ram',
    name: 'Оперативная память',
    singular: 'Оперативная память',
    navLabel: 'Память',
    description: 'Комплекты DDR4 и DDR5: объём, частота, тайминги и напряжение.',
    tagline: 'Объём, частота, тайминги',
    icon: 'ram',
    meta: (p) => [p.brand, s(p, 'memType')],
    cardSpecs: ['kit', 'speed', 'cl'],
    keySpecs: ['kit', 'speed', 'cl', 'voltage'],
    groups: [
      {
        title: 'Основное',
        specs: [
          { key: 'memType', label: 'Тип памяти' },
          {
            key: 'kit', label: 'Комплект', mono: true, better: 'higher',
            get: (p) => `${n(p, 'modules')} × ${n(p, 'moduleSize')} ГБ`,
            rank: (p) => n(p, 'modules') * n(p, 'moduleSize'),
          },
          { key: 'year', label: 'Год выхода', get: (p) => p.year || null, better: 'higher' },
        ],
      },
      {
        title: 'Скорость',
        specs: [
          { key: 'speed', label: 'Частота', unit: 'МТ/с', mono: true, better: 'higher' },
          { key: 'cl', label: 'CAS-латентность', short: 'Тайминг', format: (v) => `CL${v}`, mono: true, better: 'lower' },
          { key: 'voltage', label: 'Напряжение', unit: 'В', decimals: 2, mono: true, better: 'lower' },
        ],
      },
    ],
    filters: [
      { id: 'type', label: 'Тип', options: [eq('memType', 'DDR4'), eq('memType', 'DDR5')] },
      {
        id: 'speed', label: 'Частота',
        options: [range('low', 'до 3600 МТ/с', 'speed', 0, 3600), range('mid', '5600 МТ/с', 'speed', 5600, 5600), range('high', '6000 МТ/с и выше', 'speed', 6000)],
      },
    ],
    quickFilters: [['type', 'ddr4'], ['type', 'ddr5']],
  },
  {
    id: 'storage',
    name: 'Накопители',
    singular: 'Накопитель',
    navLabel: 'Накопители',
    description: 'SSD NVMe и SATA: объём, интерфейс, скорость и ресурс записи.',
    tagline: 'Скорость и ресурс SSD',
    icon: 'storage',
    meta: (p) => [p.brand, s(p, 'formFactor')],
    cardSpecs: ['capacity', 'read', 'iface'],
    keySpecs: ['capacity', 'iface', 'read', 'write'],
    groups: [
      {
        title: 'Основное',
        specs: [
          { key: 'type', label: 'Тип' },
          { key: 'formFactor', label: 'Форм-фактор' },
          { key: 'iface', label: 'Интерфейс' },
          {
            key: 'capacity', label: 'Объём', mono: true, better: 'higher',
            format: (v) => (typeof v === 'number' && v >= 1000 ? `${v / 1000} ТБ` : `${v} ГБ`),
          },
        ],
      },
      {
        title: 'Скорость и ресурс',
        specs: [
          { key: 'read', label: 'Чтение', unit: 'МБ/с', mono: true, better: 'higher' },
          { key: 'write', label: 'Запись', unit: 'МБ/с', mono: true, better: 'higher' },
          { key: 'tbw', label: 'Ресурс (TBW)', unit: 'ТБ', mono: true, better: 'higher' },
        ],
      },
    ],
    filters: [
      { id: 'type', label: 'Тип', options: [eq('type', 'NVMe'), eq('type', 'SATA')] },
      { id: 'iface', label: 'Интерфейс', options: [eq('iface', 'PCIe 4.0 x4', 'PCIe 4.0'), eq('iface', 'PCIe 5.0 x4', 'PCIe 5.0'), eq('iface', 'SATA III')] },
      { id: 'capacity', label: 'Объём', options: [range('1', '1 ТБ', 'capacity', 1000, 1000), range('2', '2 ТБ', 'capacity', 2000, 2000)] },
    ],
    quickFilters: [['type', 'nvme'], ['type', 'sata'], ['iface', 'pcie-5-0-x4']],
  },
  {
    id: 'psu',
    name: 'Блоки питания',
    singular: 'Блок питания',
    navLabel: 'Блоки питания',
    description: 'Блоки питания: мощность, сертификат 80 PLUS, модульность и разъёмы.',
    tagline: 'Мощность и сертификаты',
    icon: 'psu',
    meta: (p) => [p.brand, s(p, 'cert')],
    cardSpecs: ['wattage', 'cert', 'modular'],
    keySpecs: ['wattage', 'cert', 'modular', 'atx3'],
    groups: [
      {
        title: 'Основное',
        specs: [
          { key: 'wattage', label: 'Мощность', unit: 'Вт', mono: true, better: 'higher' },
          { key: 'cert', label: 'Сертификат' },
          { key: 'modular', label: 'Кабели' },
          { key: 'year', label: 'Год выхода', get: (p) => p.year || null, better: 'higher' },
        ],
      },
      {
        title: 'Стандарты',
        specs: [
          { key: 'atx3', label: 'ATX 3.0', format: yesNo('Да', 'Нет') },
          { key: 'highPower', label: 'Разъём 12V-2x6 / 12VHPWR', format: yesNo('Есть', 'Нет') },
          { key: 'fan', label: 'Вентилятор', unit: 'мм', mono: true },
        ],
      },
    ],
    filters: [
      {
        id: 'watt', label: 'Мощность',
        options: [range('low', 'до 650 Вт', 'wattage', 0, 650), range('mid', '750–850 Вт', 'wattage', 750, 850), range('high', '1000 Вт и больше', 'wattage', 1000)],
      },
      { id: 'cert', label: 'Сертификат', options: [eq('cert', '80 PLUS Bronze', 'Bronze'), eq('cert', '80 PLUS Gold', 'Gold')] },
    ],
    quickFilters: [['watt', 'low'], ['watt', 'mid'], ['watt', 'high'], ['cert', '80-plus-gold']],
  },
  {
    id: 'cooling',
    name: 'Охлаждение',
    singular: 'Охлаждение',
    navLabel: 'Охлаждение',
    description: 'Башенные кулеры и СЖО: поддерживаемые сокеты, высота и размер радиатора.',
    tagline: 'Кулеры и водянки',
    icon: 'cooling',
    meta: (p) => [p.brand, s(p, 'type')],
    cardSpecs: ['type', 'size', 'fans'],
    keySpecs: ['type', 'size', 'fans', 'sockets'],
    groups: [
      {
        title: 'Основное',
        specs: [
          { key: 'type', label: 'Тип' },
          { key: 'sockets', label: 'Сокеты' },
          { key: 'year', label: 'Год выхода', get: (p) => p.year || null, better: 'higher' },
        ],
      },
      {
        title: 'Размеры',
        specs: [
          {
            key: 'size', label: 'Высота / радиатор', short: 'Размер', mono: true,
            get: (p) => (p.specs.height ? `${p.specs.height} мм` : `${p.specs.radiator} мм`),
          },
          { key: 'fans', label: 'Вентиляторы' },
        ],
      },
    ],
    filters: [
      { id: 'type', label: 'Тип', options: [eq('type', 'Башенный', 'Башенные', 'tower'), eq('type', 'СЖО', 'СЖО', 'aio')] },
      { id: 'height', label: 'Высота', options: [range('low', 'до 160 мм', 'height', 0, 160), range('high', 'больше 160 мм', 'height', 161)] },
    ],
    quickFilters: [['type', 'tower'], ['type', 'aio']],
  },
  {
    id: 'case',
    name: 'Корпуса',
    singular: 'Корпус',
    navLabel: 'Корпуса',
    description: 'Корпуса: поддерживаемые платы, длина видеокарты, высота кулера и радиаторы.',
    tagline: 'Размеры и совместимость',
    icon: 'case',
    meta: (p) => [p.brand, s(p, 'size')],
    cardSpecs: ['maxGpu', 'maxCooler', 'maxRadiator'],
    keySpecs: ['boards', 'maxGpu', 'maxCooler', 'maxRadiator'],
    groups: [
      {
        title: 'Основное',
        specs: [
          { key: 'size', label: 'Типоразмер' },
          { key: 'boards', label: 'Материнские платы' },
          { key: 'fansIncluded', label: 'Вентиляторы в комплекте', better: 'higher' },
          { key: 'year', label: 'Год выхода', get: (p) => p.year || null, better: 'higher' },
        ],
      },
      {
        title: 'Ограничения',
        specs: [
          { key: 'maxGpu', label: 'Видеокарта до', short: 'GPU до', unit: 'мм', mono: true, better: 'higher' },
          { key: 'maxCooler', label: 'Кулер до', unit: 'мм', mono: true, better: 'higher' },
          { key: 'maxRadiator', label: 'Радиатор до', short: 'СЖО до', unit: 'мм', mono: true, better: 'higher' },
        ],
      },
    ],
    filters: [
      { id: 'board', label: 'Материнская плата', options: [eq('boards', 'ATX'), eq('boards', 'mATX')] },
      { id: 'gpu', label: 'Длина видеокарты', options: [range('360', 'до 360 мм', 'maxGpu', 0, 360), range('361', 'больше 360 мм', 'maxGpu', 361)] },
    ],
    quickFilters: [['board', 'atx'], ['board', 'matx']],
  },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<
  CategoryId,
  CategoryConfig
>;

export function isCategoryId(value: string): value is CategoryId {
  return value in categoryById;
}

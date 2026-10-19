import type { CategoryConfig, CategoryId, FacetDef, Product, SpecValue } from './types';

const n = (p: Product, key: string): number => {
  const v = p.specs[key];
  return typeof v === 'number' ? v : NaN;
};
const s = (p: Product, key: string): string => String(p.specs[key] ?? '');

const enumF = (key: string, label: string, get?: FacetDef['get']): FacetDef => ({ key, label, type: 'enum', get });
const rangeF = (key: string, label: string, unit?: string, get?: FacetDef['get']): FacetDef => ({ key, label, type: 'range', unit, get });
const brandF = enumF('brand', 'Бренд', (p) => p.brand);
const flag = (key: string, yes = 'Есть', no = 'Нет') => (p: Product) => (p.specs[key] === null || p.specs[key] === undefined ? null : p.specs[key] ? yes : no);
const yearF = rangeF('year', 'Год выхода', undefined, (p) => p.year || null);

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
    tableSpecs: ['socket', 'coresThreads', 'boostClock', 'l3', 'tdp'],
    facets: [
      brandF,
      enumF('socket', 'Сокет'),
      enumF('memory', 'Тип памяти'),
      rangeF('cores', 'Ядра'),
      rangeF('boostClock', 'Частота до', 'ГГц'),
      rangeF('tdp', 'TDP', 'Вт'),
      enumF('igpu', 'Встроенная графика', (p) => (p.specs.igpu ? 'Есть' : 'Нет')),
      enumF('unlocked', 'Разгон', flag('unlocked', 'Разблокирован', 'Заблокирован')),
      yearF,
    ],
    quick: [['brand', 'AMD'], ['brand', 'Intel'], ['socket', 'AM5'], ['socket', 'AM4'], ['socket', 'LGA1700'], ['socket', 'LGA1851']],
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
    tableSpecs: ['vram', 'memType', 'bus', 'tdp', 'recPsu'],
    facets: [
      brandF,
      rangeF('vram', 'Видеопамять', 'ГБ'),
      enumF('memType', 'Тип памяти'),
      rangeF('bus', 'Шина', 'бит'),
      rangeF('tdp', 'TDP', 'Вт'),
      rangeF('recPsu', 'Рекомендуемый БП', 'Вт'),
      yearF,
    ],
    quick: [['brand', 'NVIDIA'], ['brand', 'AMD'], ['brand', 'Intel'], ['memType', 'GDDR7'], ['memType', 'GDDR6']],
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
    tableSpecs: ['socket', 'chipset', 'formFactor', 'memType', 'm2'],
    facets: [
      brandF,
      enumF('socket', 'Сокет'),
      enumF('chipset', 'Чипсет'),
      enumF('formFactor', 'Форм-фактор'),
      enumF('memType', 'Тип памяти'),
      rangeF('m2', 'Слоты M.2'),
      enumF('wifi', 'Wi-Fi', (p) => (p.specs.wifi === undefined || p.specs.wifi === null ? null : p.specs.wifi ? 'Есть' : 'Нет')),
    ],
    quick: [['socket', 'AM5'], ['socket', 'AM4'], ['socket', 'LGA1700'], ['formFactor', 'ATX'], ['formFactor', 'mATX']],
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
          { key: 'height', label: 'Высота модуля', unit: 'мм', mono: true, better: 'lower' },
        ],
      },
    ],
    tableSpecs: ['memType', 'kit', 'speed', 'cl'],
    facets: [
      brandF,
      enumF('memType', 'Тип памяти'),
      enumF('kit', 'Комплект', (p) => `${n(p, 'modules')} × ${n(p, 'moduleSize')} ГБ`),
      rangeF('total', 'Объём комплекта', 'ГБ', (p) => n(p, 'modules') * n(p, 'moduleSize') || null),
      rangeF('speed', 'Частота', 'МТ/с'),
      rangeF('cl', 'CAS-латентность'),
    ],
    quick: [['memType', 'DDR5'], ['memType', 'DDR4']],
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
    tableSpecs: ['type', 'capacity', 'iface', 'read', 'write'],
    facets: [
      brandF,
      enumF('type', 'Тип'),
      enumF('formFactor', 'Форм-фактор'),
      enumF('iface', 'Интерфейс'),
      rangeF('capacity', 'Объём', 'ГБ'),
      rangeF('read', 'Чтение', 'МБ/с'),
    ],
    quick: [['type', 'NVMe'], ['type', 'SATA'], ['iface', 'PCIe 4.0 x4'], ['iface', 'PCIe 5.0 x4']],
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
    tableSpecs: ['wattage', 'cert', 'modular', 'highPower'],
    facets: [
      brandF,
      rangeF('wattage', 'Мощность', 'Вт'),
      enumF('cert', 'Сертификат'),
      enumF('modular', 'Кабели'),
      enumF('highPower', 'Разъём 12V-2x6', flag('highPower')),
    ],
    quick: [['cert', '80 PLUS Gold'], ['cert', '80 PLUS Bronze'], ['highPower', 'Есть']],
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
          { key: 'maxTdp', label: 'Рассеивает до', unit: 'Вт', mono: true, better: 'higher' },
        ],
      },
    ],
    tableSpecs: ['type', 'size', 'fans', 'sockets'],
    facets: [
      brandF,
      enumF('type', 'Тип'),
      enumF('sockets', 'Сокет'),
      rangeF('height', 'Высота', 'мм'),
      enumF('radiator', 'Радиатор СЖО', (p) => (p.specs.radiator ? `${p.specs.radiator} мм` : null)),
    ],
    quick: [['type', 'Башенный'], ['type', 'СЖО'], ['sockets', 'AM5'], ['sockets', 'LGA1700']],
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
    tableSpecs: ['size', 'boards', 'maxGpu', 'maxCooler', 'maxRadiator'],
    facets: [
      brandF,
      enumF('size', 'Типоразмер'),
      enumF('boards', 'Материнская плата'),
      rangeF('maxGpu', 'Видеокарта до', 'мм'),
      rangeF('maxCooler', 'Кулер до', 'мм'),
      rangeF('maxRadiator', 'Радиатор до', 'мм'),
    ],
    quick: [['boards', 'ATX'], ['boards', 'mATX'], ['boards', 'Mini-ITX']],
  },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<
  CategoryId,
  CategoryConfig
>;

export function isCategoryId(value: string): value is CategoryId {
  return value in categoryById;
}

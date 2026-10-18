import type { Product } from '../types';

export const rams: Product[] = [
  {
    slug: 'kingston-fury-beast-ddr5-6000-2x16',
    category: 'ram', brand: 'Kingston', name: 'FURY Beast DDR5-6000 2×16 ГБ', year: 2023, popularity: 1,
    specs: { memType: 'DDR5', modules: 2, moduleSize: 16, speed: 6000, cl: 36, voltage: 1.35 },
  },
  {
    slug: 'gskill-trident-z5-neo-rgb-ddr5-6000-2x16',
    category: 'ram', brand: 'G.Skill', name: 'Trident Z5 Neo RGB DDR5-6000 2×16 ГБ', year: 2022, popularity: 2,
    specs: { memType: 'DDR5', modules: 2, moduleSize: 16, speed: 6000, cl: 30, voltage: 1.35 },
  },
  {
    slug: 'kingston-fury-beast-ddr4-3200-2x16',
    category: 'ram', brand: 'Kingston', name: 'FURY Beast DDR4-3200 2×16 ГБ', year: 2021, popularity: 3,
    specs: { memType: 'DDR4', modules: 2, moduleSize: 16, speed: 3200, cl: 16, voltage: 1.35 },
  },
  {
    slug: 'corsair-vengeance-ddr5-5600-2x16',
    category: 'ram', brand: 'Corsair', name: 'Vengeance DDR5-5600 2×16 ГБ', year: 2022, popularity: 4,
    specs: { memType: 'DDR5', modules: 2, moduleSize: 16, speed: 5600, cl: 36, voltage: 1.25 },
  },
  {
    slug: 'corsair-vengeance-lpx-ddr4-3600-2x16',
    category: 'ram', brand: 'Corsair', name: 'Vengeance LPX DDR4-3600 2×16 ГБ', year: 2019, popularity: 5,
    specs: { memType: 'DDR4', modules: 2, moduleSize: 16, speed: 3600, cl: 18, voltage: 1.35 },
  },
];

export const storages: Product[] = [
  {
    slug: 'samsung-990-pro-2tb',
    category: 'storage', brand: 'Samsung', name: '990 PRO 2 ТБ', year: 2022, popularity: 1,
    specs: { type: 'NVMe', formFactor: 'M.2 2280', iface: 'PCIe 4.0 x4', capacity: 2000, read: 7450, write: 6900, tbw: 1200 },
  },
  {
    slug: 'wd-black-sn850x-1tb',
    category: 'storage', brand: 'WD', name: 'WD_BLACK SN850X 1 ТБ', year: 2022, popularity: 2,
    specs: { type: 'NVMe', formFactor: 'M.2 2280', iface: 'PCIe 4.0 x4', capacity: 1000, read: 7300, write: 6300, tbw: 600 },
  },
  {
    slug: 'kingston-nv2-1tb',
    category: 'storage', brand: 'Kingston', name: 'NV2 1 ТБ', year: 2022, popularity: 3,
    specs: { type: 'NVMe', formFactor: 'M.2 2280', iface: 'PCIe 4.0 x4', capacity: 1000, read: 3500, write: 2100, tbw: 320 },
  },
  {
    slug: 'crucial-t700-2tb',
    category: 'storage', brand: 'Crucial', name: 'T700 2 ТБ', year: 2023, popularity: 4,
    specs: { type: 'NVMe', formFactor: 'M.2 2280', iface: 'PCIe 5.0 x4', capacity: 2000, read: 12400, write: 11800, tbw: 1200 },
  },
  {
    slug: 'samsung-870-evo-1tb',
    category: 'storage', brand: 'Samsung', name: '870 EVO 1 ТБ', year: 2021, popularity: 5,
    specs: { type: 'SATA', formFactor: '2,5"', iface: 'SATA III', capacity: 1000, read: 560, write: 530, tbw: 600 },
  },
];

export const psus: Product[] = [
  {
    slug: 'corsair-rm750e-2023',
    category: 'psu', brand: 'Corsair', name: 'RM750e (2023)', year: 2023, popularity: 1,
    specs: { wattage: 750, cert: '80 PLUS Gold', modular: 'Полностью модульный', atx3: true, highPower: true, fan: 120 },
  },
  {
    slug: 'deepcool-pk650d',
    category: 'psu', brand: 'DeepCool', name: 'PK650D', year: 2022, popularity: 2,
    specs: { wattage: 650, cert: '80 PLUS Bronze', modular: 'Немодульный', atx3: false, highPower: false, fan: 120 },
  },
  {
    slug: 'be-quiet-pure-power-12-m-850w',
    category: 'psu', brand: 'be quiet!', name: 'Pure Power 12 M 850W', year: 2023, popularity: 3,
    specs: { wattage: 850, cert: '80 PLUS Gold', modular: 'Полностью модульный', atx3: true, highPower: true, fan: 120 },
  },
  {
    slug: 'seasonic-focus-gx-1000-atx3',
    category: 'psu', brand: 'Seasonic', name: 'FOCUS GX-1000 ATX 3.0', year: 2023, popularity: 4,
    specs: { wattage: 1000, cert: '80 PLUS Gold', modular: 'Полностью модульный', atx3: true, highPower: true, fan: 120 },
  },
  {
    slug: 'msi-mag-a550bn',
    category: 'psu', brand: 'MSI', name: 'MAG A550BN', year: 2020, popularity: 5,
    specs: { wattage: 550, cert: '80 PLUS Bronze', modular: 'Немодульный', atx3: false, highPower: false, fan: 120 },
  },
];

export const coolers: Product[] = [
  {
    slug: 'deepcool-ak400',
    category: 'cooling', brand: 'DeepCool', name: 'AK400', year: 2022, popularity: 1,
    specs: { type: 'Башенный', sockets: ['AM4', 'AM5', 'LGA1700'], height: 155, radiator: null, fans: '1 × 120 мм' },
  },
  {
    slug: 'thermalright-peerless-assassin-120-se',
    category: 'cooling', brand: 'Thermalright', name: 'Peerless Assassin 120 SE', year: 2022, popularity: 2,
    specs: { type: 'Башенный', sockets: ['AM4', 'AM5', 'LGA1700'], height: 155, radiator: null, fans: '2 × 120 мм' },
  },
  {
    slug: 'arctic-liquid-freezer-iii-360',
    category: 'cooling', brand: 'ARCTIC', name: 'Liquid Freezer III 360', year: 2024, popularity: 3,
    specs: { type: 'СЖО', sockets: ['AM4', 'AM5', 'LGA1700'], height: null, radiator: 360, fans: '3 × 120 мм' },
  },
  {
    slug: 'noctua-nh-d15',
    category: 'cooling', brand: 'Noctua', name: 'NH-D15', year: 2014, popularity: 4,
    specs: { type: 'Башенный', sockets: ['AM4', 'AM5', 'LGA1700'], height: 165, radiator: null, fans: '2 × 140 мм' },
  },
  {
    slug: 'be-quiet-dark-rock-pro-5',
    category: 'cooling', brand: 'be quiet!', name: 'Dark Rock Pro 5', year: 2023, popularity: 5,
    specs: { type: 'Башенный', sockets: ['AM4', 'AM5', 'LGA1700'], height: 168, radiator: null, fans: '135 + 120 мм' },
  },
];

export const cases: Product[] = [
  {
    slug: 'fractal-design-north',
    category: 'case', brand: 'Fractal Design', name: 'North', year: 2022, popularity: 1,
    specs: { size: 'Mid Tower', boards: ['ATX', 'mATX', 'Mini-ITX'], maxGpu: 355, maxCooler: 170, maxRadiator: 360, fansIncluded: 2 },
  },
  {
    slug: 'lian-li-lancool-216',
    category: 'case', brand: 'Lian Li', name: 'LANCOOL 216', year: 2023, popularity: 2,
    specs: { size: 'Mid Tower', boards: ['E-ATX', 'ATX', 'mATX', 'Mini-ITX'], maxGpu: 392, maxCooler: 180, maxRadiator: 360, fansIncluded: 3 },
  },
  {
    slug: 'nzxt-h5-flow',
    category: 'case', brand: 'NZXT', name: 'H5 Flow', year: 2022, popularity: 3,
    specs: { size: 'Mid Tower', boards: ['ATX', 'mATX', 'Mini-ITX'], maxGpu: 365, maxCooler: 165, maxRadiator: 280, fansIncluded: 2 },
  },
  {
    slug: 'cooler-master-masterbox-q300l',
    category: 'case', brand: 'Cooler Master', name: 'MasterBox Q300L', year: 2018, popularity: 4,
    specs: { size: 'Mini Tower', boards: ['mATX', 'Mini-ITX'], maxGpu: 360, maxCooler: 159, maxRadiator: 240, fansIncluded: 1 },
  },
];

import type { BuildSlugs } from '@/lib/compatibility';

/** Ready-made builds: a starting point on the home page and in the builder */
export interface Preset {
  id: string;
  name: string;
  /** One line: what the build is for */
  note: string;
  slots: BuildSlugs;
}

export const presets: Preset[] = [
  {
    id: 'am4-budget',
    name: 'Недорогая',
    note: 'Игры в Full HD на средних настройках',
    slots: {
      cpu: 'amd-ryzen-5-5600',
      cooling: 'deepcool-ak400',
      motherboard: 'msi-mag-b550-tomahawk',
      ram: 'corsair-vengeance-lpx-ddr4-3600-2x16',
      storage: 'kingston-nv2-1tb',
      gpu: 'amd-radeon-rx-7600',
      psu: 'msi-mag-a550bn',
      case: 'nzxt-h5-flow',
    },
  },
  {
    id: 'fullhd',
    name: 'Full HD',
    note: 'Компактная сборка на AM5 с запасом на апгрейд',
    slots: {
      cpu: 'amd-ryzen-5-7600',
      cooling: 'thermalright-peerless-assassin-120-se',
      motherboard: 'gigabyte-b650m-aorus-elite-ax',
      ram: 'kingston-fury-beast-ddr5-6000-2x16',
      storage: 'kingston-nv2-1tb',
      gpu: 'nvidia-geforce-rtx-4060',
      psu: 'deepcool-pk650d',
      case: 'cooler-master-masterbox-q300l',
    },
  },
  {
    id: 'qhd',
    name: '2K',
    note: 'Высокие настройки в 1440p',
    slots: {
      cpu: 'amd-ryzen-7-7800x3d',
      cooling: 'thermalright-peerless-assassin-120-se',
      motherboard: 'msi-mag-b650-tomahawk-wifi',
      ram: 'kingston-fury-beast-ddr5-6000-2x16',
      storage: 'wd-black-sn850x-1tb',
      gpu: 'nvidia-geforce-rtx-4070-super',
      psu: 'corsair-rm750e-2023',
      case: 'lian-li-lancool-216',
    },
  },
  {
    id: 'work',
    name: 'Монтаж',
    note: 'Видео, 3D и много вкладок одновременно',
    slots: {
      cpu: 'amd-ryzen-9-9950x',
      cooling: 'arctic-liquid-freezer-iii-360',
      motherboard: 'asus-rog-strix-x670e-e-gaming-wifi',
      ram: 'gskill-trident-z5-neo-rgb-ddr5-6000-2x16',
      storage: 'samsung-990-pro-2tb',
      gpu: 'nvidia-geforce-rtx-5070',
      psu: 'seasonic-focus-gx-1000-atx3',
      case: 'fractal-design-north',
    },
  },
];

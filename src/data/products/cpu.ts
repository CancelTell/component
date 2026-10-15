import type { Product } from '../types';

export const cpus: Product[] = [
  {
    slug: 'amd-ryzen-5-7600',
    category: 'cpu',
    brand: 'AMD',
    name: 'Ryzen 5 7600',
    year: 2023,
    popularity: 1,
    specs: {
      socket: 'AM5', arch: 'Zen 4', unlocked: true,
      cores: 6, threads: 12, baseClock: 3.8, boostClock: 5.1, l3: 32, tdp: 65,
      memory: ['DDR5'], channels: 2, pcie: '5.0', igpu: 'Radeon Graphics',
    },
  },
  {
    slug: 'amd-ryzen-7-7800x3d',
    category: 'cpu',
    brand: 'AMD',
    name: 'Ryzen 7 7800X3D',
    year: 2023,
    popularity: 2,
    specs: {
      socket: 'AM5', arch: 'Zen 4', unlocked: false,
      cores: 8, threads: 16, baseClock: 4.2, boostClock: 5.0, l3: 96, tdp: 120,
      memory: ['DDR5'], channels: 2, pcie: '5.0', igpu: 'Radeon Graphics',
    },
  },
  {
    slug: 'intel-core-i7-14700k',
    category: 'cpu',
    brand: 'Intel',
    name: 'Core i7-14700K',
    year: 2023,
    popularity: 3,
    specs: {
      socket: 'LGA1700', arch: 'Raptor Lake Refresh', unlocked: true,
      cores: 20, threads: 28, baseClock: 3.4, boostClock: 5.6, l3: 33, tdp: 125,
      memory: ['DDR4', 'DDR5'], channels: 2, pcie: '5.0', igpu: 'Intel UHD 770',
    },
  },
  {
    slug: 'intel-core-i5-14400f',
    category: 'cpu',
    brand: 'Intel',
    name: 'Core i5-14400F',
    year: 2024,
    popularity: 4,
    specs: {
      socket: 'LGA1700', arch: 'Raptor Lake Refresh', unlocked: false,
      cores: 10, threads: 16, baseClock: 2.5, boostClock: 4.7, l3: 20, tdp: 65,
      memory: ['DDR4', 'DDR5'], channels: 2, pcie: '5.0', igpu: null,
    },
  },
  {
    slug: 'amd-ryzen-5-5600',
    category: 'cpu',
    brand: 'AMD',
    name: 'Ryzen 5 5600',
    year: 2022,
    popularity: 5,
    specs: {
      socket: 'AM4', arch: 'Zen 3', unlocked: true,
      cores: 6, threads: 12, baseClock: 3.5, boostClock: 4.4, l3: 32, tdp: 65,
      memory: ['DDR4'], channels: 2, pcie: '4.0', igpu: null,
    },
  },
  {
    slug: 'intel-core-i5-14600k',
    category: 'cpu',
    brand: 'Intel',
    name: 'Core i5-14600K',
    year: 2023,
    popularity: 6,
    specs: {
      socket: 'LGA1700', arch: 'Raptor Lake Refresh', unlocked: true,
      cores: 14, threads: 20, baseClock: 3.5, boostClock: 5.3, l3: 24, tdp: 125,
      memory: ['DDR4', 'DDR5'], channels: 2, pcie: '5.0', igpu: 'Intel UHD 770',
    },
  },
  {
    slug: 'amd-ryzen-7-7700',
    category: 'cpu',
    brand: 'AMD',
    name: 'Ryzen 7 7700',
    year: 2023,
    popularity: 7,
    specs: {
      socket: 'AM5', arch: 'Zen 4', unlocked: true,
      cores: 8, threads: 16, baseClock: 3.8, boostClock: 5.3, l3: 32, tdp: 65,
      memory: ['DDR5'], channels: 2, pcie: '5.0', igpu: 'Radeon Graphics',
    },
  },
  {
    slug: 'amd-ryzen-7-9700x',
    category: 'cpu',
    brand: 'AMD',
    name: 'Ryzen 7 9700X',
    year: 2024,
    popularity: 8,
    specs: {
      socket: 'AM5', arch: 'Zen 5', unlocked: true,
      cores: 8, threads: 16, baseClock: 3.8, boostClock: 5.5, l3: 32, tdp: 65,
      memory: ['DDR5'], channels: 2, pcie: '5.0', igpu: 'Radeon Graphics',
    },
  },
  {
    slug: 'amd-ryzen-9-9950x',
    category: 'cpu',
    brand: 'AMD',
    name: 'Ryzen 9 9950X',
    year: 2024,
    popularity: 9,
    specs: {
      socket: 'AM5', arch: 'Zen 5', unlocked: true,
      cores: 16, threads: 32, baseClock: 4.3, boostClock: 5.7, l3: 64, tdp: 170,
      memory: ['DDR5'], channels: 2, pcie: '5.0', igpu: 'Radeon Graphics',
    },
  },
];

/** Chipsets of motherboards that accept a given socket */
export const chipsetsBySocket: Record<string, string[]> = {
  AM4: ['A520', 'B450', 'B550', 'X570'],
  AM5: ['A620', 'B650', 'B650E', 'B850', 'X670', 'X670E', 'X870', 'X870E'],
  LGA1700: ['H610', 'B660', 'B760', 'H770', 'Z690', 'Z790'],
};

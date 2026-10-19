import type { CategoryId, Product, Specs } from '@/data/types';

let n = 0;
/** Minimal product for tests: only what the rules read */
export function product(category: CategoryId, specs: Specs, name = `${category} ${++n}`, brand = 'Test'): Product {
  return { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), category, brand, name, year: 2024, popularity: n, specs };
}

export const cpu = (specs: Specs = {}, name = 'Ryzen 5 7600') =>
  product('cpu', { socket: 'AM5', memory: ['DDR5'], tdp: 65, cores: 6, threads: 12, ...specs }, name, 'AMD');
export const board = (specs: Specs = {}) =>
  product('motherboard', { socket: 'AM5', chipset: 'B850', formFactor: 'ATX', memType: 'DDR5', memSlots: 4, m2: 2, ...specs });
export const ram = (specs: Specs = {}) => product('ram', { memType: 'DDR5', modules: 2, moduleSize: 16, ...specs });
export const gpu = (specs: Specs = {}) => product('gpu', { tdp: 200, recPsu: 650, vram: 12, ...specs });
export const psu = (specs: Specs = {}) => product('psu', { wattage: 750, ...specs });
export const pcCase = (specs: Specs = {}) => product('case', { boards: ['ATX', 'mATX'], maxGpu: 360, maxCooler: 165, maxRadiator: 360, ...specs });
export const cooler = (specs: Specs = {}) => product('cooling', { type: 'Башенный', sockets: ['AM5', 'LGA1700'], height: 155, fans: '2 × 120 мм', ...specs });
export const ssd = (specs: Specs = {}) => product('storage', { type: 'NVMe', capacity: 1000, ...specs });

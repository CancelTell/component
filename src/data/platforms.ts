/**
 * Platform knowledge used by the compatibility checks: chipsets per socket and
 * board + CPU pairs that need a BIOS update. Edit this file when a new generation comes out.
 */

export const chipsetsBySocket: Record<string, string[]> = {
  AM4: ['A520', 'B450', 'B550', 'X470', 'X570'],
  AM5: ['A620', 'B650', 'B650E', 'B840', 'B850', 'X670', 'X670E', 'X870', 'X870E'],
  LGA1700: ['H610', 'B660', 'H670', 'B760', 'H770', 'Z690', 'Z790'],
  LGA1851: ['H810', 'B860', 'Z890'],
};

export interface BiosRule {
  socket: string;
  /** Chipset names as in the board specs */
  chipsets: string[];
  /** Matches the CPU name ("Ryzen 7 9700X", "Core i5-14400F") */
  cpu: RegExp;
  /** Short line for the check */
  short: string;
  /** Plain-language explanation for «Подробнее» */
  details: string;
}

const FLASHBACK =
  'Проверьте на сайте производителя платы, с какой версии BIOS поддерживается процессор. Многие платы обновляются без процессора кнопкой BIOS Flashback (Q-Flash Plus, Flash BIOS Button), иначе понадобится любой совместимый процессор на время обновления. Платы, выпущенные недавно, часто уже идут с новой прошивкой.';

export const biosRules: BiosRule[] = [
  {
    socket: 'AM5',
    chipsets: ['A620', 'B650', 'B650E', 'X670', 'X670E'],
    cpu: /Ryzen \d+ 9\d{3}/,
    short: 'Может понадобиться обновление BIOS',
    details: `Платы на чипсетах 600-й серии вышли раньше процессоров Ryzen 9000. ${FLASHBACK}`,
  },
  {
    socket: 'AM4',
    chipsets: ['B450', 'X470'],
    cpu: /Ryzen \d+ 5\d{3}/,
    short: 'Нужна свежая версия BIOS',
    details: `Платы B450 и X470 поддерживают Ryzen 5000 только с обновлённым BIOS. ${FLASHBACK}`,
  },
  {
    socket: 'AM4',
    chipsets: ['A520', 'B550', 'X570'],
    cpu: /Ryzen \d+ 5\d{3}/,
    short: 'Проверьте версию BIOS',
    details: `Первые партии плат A520, B550 и X570 выпускались до Ryzen 5000. ${FLASHBACK}`,
  },
  {
    socket: 'LGA1700',
    chipsets: ['H610', 'B660', 'H670', 'Z690'],
    cpu: /Core i\d-1[34]\d{3}/,
    short: 'Может понадобиться обновление BIOS',
    details: `Платы 600-й серии вышли вместе с Core 12-го поколения; Core 13-го и 14-го поколений работают на них после обновления BIOS. ${FLASHBACK}`,
  },
];

export function biosRule(socket: string, chipset: string, cpuName: string): BiosRule | null {
  return biosRules.find((r) => r.socket === socket && r.chipsets.includes(chipset) && r.cpu.test(cpuName)) ?? null;
}

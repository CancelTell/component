import type { SVGProps } from 'react';
import * as Lu from 'react-icons/lu';

export type LucideProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string; color?: string };
const wrap = (C: any) => ({ size = 24, strokeWidth = 2, ...rest }: LucideProps) => <C size={size} strokeWidth={strokeWidth} {...rest} />;
export const ArrowDownUp = wrap(Lu.LuArrowDownUp);
export const ArrowRight = wrap(Lu.LuArrowRight);
export const Check = wrap(Lu.LuCheck);
export const ChevronDown = wrap(Lu.LuChevronDown);
export const ChevronRight = wrap(Lu.LuChevronRight);
export const CircuitBoard = wrap(Lu.LuCircuitBoard);
export const Cpu = wrap(Lu.LuCpu);
export const Fan = wrap(Lu.LuFan);
export const Filter = wrap(Lu.LuFilter);
export const HardDrive = wrap(Lu.LuHardDrive);
export const MemoryStick = wrap(Lu.LuMemoryStick);
export const Menu = wrap(Lu.LuMenu);
export const Minus = wrap(Lu.LuMinus);
export const Moon = wrap(Lu.LuMoon);
export const PcCase = wrap(Lu.LuPcCase);
export const Plug = wrap(Lu.LuPlug);
export const Plus = wrap(Lu.LuPlus);
export const Scale = wrap(Lu.LuScale);
export const Search = wrap(Lu.LuSearch);
export const Sun = wrap(Lu.LuSun);
export const X = wrap(Lu.LuX);
export const Gpu = ({ size = 24, strokeWidth = 2, color = 'currentColor', ...rest }: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M2 21V3" /><path d="M2 5h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2.26" /><path d="M7 17v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3" /><circle cx="16" cy="11" r="2" /><circle cx="8" cy="11" r="2" />
  </svg>
);

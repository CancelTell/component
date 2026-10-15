import { CircuitBoard, Cpu, Fan, Gpu, HardDrive, MemoryStick, PcCase, Plug, type LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';
import type { IconName } from '@/data/types';

const icons = {
  cpu: Cpu,
  gpu: Gpu,
  motherboard: CircuitBoard,
  ram: MemoryStick,
  storage: HardDrive,
  psu: Plug,
  cooling: Fan,
  case: PcCase,
} satisfies Record<IconName, ComponentType<LucideProps>>;

interface Props extends LucideProps {
  name: IconName;
}

export function CategoryIcon({ name, size = 24, strokeWidth = 1.5, ...rest }: Props) {
  const Icon = icons[name];
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}

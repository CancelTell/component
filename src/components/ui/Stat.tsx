import type { StatItem } from '@/lib/catalog';

export function Stat({ item, monoValue = false }: { item: StatItem; monoValue?: boolean }) {
  return (
    <div className="stat">
      <span className="stat__label">{item.label}</span>
      <span className={`stat__value${monoValue && item.mono ? ' stat__value--mono' : ''}`} title={item.value}>
        {item.value}
      </span>
    </div>
  );
}

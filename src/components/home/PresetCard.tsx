'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import type { IconName } from '@/data/types';
import type { BuildSlugs } from '@/lib/compatibility';
import { loadBuild } from '@/lib/build-store';
import { ComponentArt, artStyle } from '@/components/ui/ComponentArt';

interface Props {
  name: string;
  note: string;
  /** Key parts: [label, model] */
  parts: Array<[string, string]>;
  slots: BuildSlugs;
  /** Colour of the card (borrowed from a category gradient) */
  tone: IconName;
  index: number;
}

/** A ready build: one click opens it in the constructor, where every part can be changed */
export function PresetCard({ name, note, parts, slots, tone, index }: Props) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="preset"
      style={{ ...artStyle(tone), ['--i' as string]: index } as CSSProperties}
      onClick={() => {
        loadBuild(slots);
        router.push('/build');
      }}
    >
      <span className="preset__media" aria-hidden="true">
        <ComponentArt name="case" />
        <span className="preset__count">{Object.keys(slots).length} деталей</span>
      </span>
      <span className="preset__body">
        <span className="preset__name">{name}</span>
        <span className="preset__note">{note}</span>
        <span className="preset__parts">
          {parts.map(([label, model]) => (
            <span key={label}>
              <span className="preset__part-label">{label}</span>
              {model}
            </span>
          ))}
        </span>
        <span className="preset__go">
          Открыть в конструкторе
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

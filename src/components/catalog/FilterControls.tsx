'use client';

import type { FilterGroup } from '@/data/types';
import type { FilterState } from '@/lib/catalog';

interface Props {
  groups: FilterGroup[];
  state: FilterState;
  onToggle: (groupId: string, optionId: string) => void;
  variant: 'checkbox' | 'chips';
}

/** Filter groups rendered as checkbox lists (desktop sidebar) or chip rows (mobile sheet) */
export function FilterControls({ groups, state, onToggle, variant }: Props) {
  return (
    <>
      {groups.map((group) => {
        const selected = state[group.id] ?? [];
        return (
          <fieldset key={group.id} className="filter-group">
            <legend className="filter-group__label">{group.label}</legend>
            {variant === 'checkbox' ? (
              <div className="filters__options">
                {group.options.map((o) => (
                  <label key={o.id} className="checkbox">
                    <input
                      type="checkbox"
                      className="checkbox__input"
                      checked={selected.includes(o.id)}
                      onChange={() => onToggle(group.id, o.id)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            ) : (
              <div className="chips">
                {group.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`chip${selected.includes(o.id) ? ' chip--active' : ''}`}
                    aria-pressed={selected.includes(o.id)}
                    onClick={() => onToggle(group.id, o.id)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </fieldset>
        );
      })}
    </>
  );
}

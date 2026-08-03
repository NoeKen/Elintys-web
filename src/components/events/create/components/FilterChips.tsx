'use client';

import { cn } from '@/shared/lib/utils';
import {
  
  
  
  
  type ManualProviderDraft,
  type ProviderCategory
  
} from '@/features/events/lib/event-creation';

export function FilterChips({
  title,
  entries,
  selected,
  onChange
}: {
  title: string;
  entries: Array<[string, string]>;
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-event-ink">
        {title}
      </legend>
      <div className="flex flex-wrap gap-2">
        {entries.map(([value, label]) => (
          <label
            key={value}
            className={cn(
              'cursor-pointer rounded-full px-3 py-2 text-xs font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
              selected.includes(value)
                ? 'bg-event-petrol text-white'
                : 'bg-white text-event-muted',
            )}
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() =>
                onChange(
                  selected.includes(value)
                    ? selected.filter((item) => item !== value)
                    : [...selected, value],
                )
              }
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export type ManualProviderMap = Partial<
  Record<ProviderCategory, ManualProviderDraft>
>;
export type SelectedVendorMap = Partial<Record<ProviderCategory, string>>;

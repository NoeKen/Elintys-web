'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { IconChevronDown, IconCheck } from '@/lib/icons';
import { cn } from '@/shared/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ options, value, onValueChange, placeholder = 'Sélectionner…', disabled, className }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        className={cn(
          'flex w-full items-center justify-between',
          'border-b-2 border-outline-variant/30 bg-transparent py-2 text-sm text-on-surface',
          'focus:outline-none focus:border-accent/60',
          'data-[placeholder]:text-on-surface-variant',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200',
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <IconChevronDown size={16} className="text-on-surface-variant" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={cn(
            'z-50 min-w-[180px] rounded-[8px] bg-surface-lowest',
            'shadow-[0px_4px_16px_rgba(13,30,53,0.10)]',
            'overflow-hidden'
          )}
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-[6px] px-3 py-2 text-sm text-on-surface',
                  'hover:bg-surface-low focus:bg-surface-low focus:outline-none',
                  'data-[highlighted]:bg-surface-low',
                  'select-none'
                )}
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="ml-auto">
                  <IconCheck size={14} className="text-accent" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

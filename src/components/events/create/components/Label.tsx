'use client';

import {
  eventCreationCopy as copy
  
} from '@/features/events/i18n/event-creation.copy';

export function Label({
  htmlFor,
  children,
  optional = false
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.1em] text-event-ink"
    >
      {children}
      {optional && (
        <span className="font-medium normal-case tracking-normal text-event-muted">
          {copy.optional}
        </span>
      )}
    </label>
  );
}

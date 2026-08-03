'use client';

import type {
  FieldErrors,
  UseFormRegister
  
} from 'react-hook-form';
import {
  eventCreationCopy as copy
  
} from '@/features/events/i18n/event-creation.copy';
import {
  
  
  type EventCreationFormValues
  
  
  
  
} from '@/features/events/lib/event-creation';
import { FieldError } from './FieldError';
import { Label } from './Label';

export function ManualVenueFields({
  register,
  errors
}: {
  register: UseFormRegister<EventCreationFormValues>;
  errors: FieldErrors<EventCreationFormValues>;
}) {
  const fields = [
    ['venueName', copy.venue.name],
    ['venueAddress', copy.venue.address],
    ['venueCity', copy.venue.city],
    ['venueProvince', copy.venue.province],
    ['venuePostalCode', copy.venue.postalCode],
    ['venueContactName', copy.venue.contactName],
    ['venueContactPhone', copy.venue.phone],
    ['venueContactEmail', copy.venue.email],
  ] as const;
  return (
    <div className="rounded-3xl bg-event-surface p-5 sm:p-7">
      <p className="mb-6 text-sm text-event-muted">{copy.venue.manualNote}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([name, label], index) => (
          <div key={name} className={index === 1 ? 'sm:col-span-2' : undefined}>
            <Label htmlFor={name} optional={index >= 5}>
              {label}
            </Label>
            <input
              id={name}
              type={name === 'venueContactEmail' ? 'email' : 'text'}
              {...register(name)}
              aria-invalid={Boolean(errors[name])}
              className="event-input"
            />
            <FieldError message={errors[name]?.message} />
          </div>
        ))}
      </div>
    </div>
  );
}

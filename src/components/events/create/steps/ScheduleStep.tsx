'use client';

import {
  
  
  
  CalendarDays,
  
  
  
  
  
  Clock3,
  
  
  
  
  Lightbulb,
  MapPin,
  
  
  
  Search,
  
  
  
  UsersRound,
  Video
  
  
} from 'lucide-react';
import type {
  
  
  UseFormReturn
} from 'react-hook-form';
import { cn } from '@/shared/lib/utils';
import {
  eventCreationCopy as copy
  
} from '@/features/events/i18n/event-creation.copy';
import {
  
  
  type EventCreationFormValues
  
  
  
  
} from '@/features/events/lib/event-creation';
import { FieldError } from '../components/FieldError';
import { Label } from '../components/Label';
import { StepHeading } from '../components/StepHeading';

interface ScheduleStepProps {
  form: UseFormReturn<EventCreationFormValues>;
}

export function ScheduleStep({ form }: ScheduleStepProps) {
  const errors = form.formState.errors;
  const format = form.watch('format');
  const venueMode = form.watch('venueMode');
  const dateIsTentative = form.watch('dateIsTentative');
  const formats = [
    { value: 'physical' as const, Icon: MapPin },
    { value: 'hybrid' as const, Icon: UsersRound },
    { value: 'online' as const, Icon: Video },
  ];
  const venueModes = [
    { value: 'existing' as const, Icon: MapPin },
    { value: 'search' as const, Icon: Search },
    { value: 'later' as const, Icon: Clock3 },
  ];

  return (
    <section>
      <StepHeading
        eyebrow={copy.schedule.eyebrow}
        title={copy.schedule.title}
        subtitle={copy.schedule.subtitle}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <fieldset className="rounded-3xl bg-event-surface p-5 sm:p-7">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-event-ink">
            <CalendarDays className="h-4 w-4 text-event-teal" aria-hidden="true" />
            {copy.schedule.calendar}
          </legend>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">{copy.schedule.startDate}</Label>
              <input
                id="start-date"
                type="date"
                {...form.register('startDate')}
                disabled={dateIsTentative}
                className="event-input disabled:opacity-45"
              />
              <FieldError message={errors.startDate?.message} />
            </div>
            <div>
              <Label htmlFor="start-time">{copy.schedule.startTime}</Label>
              <input
                id="start-time"
                type="time"
                {...form.register('startTime')}
                disabled={dateIsTentative}
                className="event-input disabled:opacity-45"
              />
            </div>
            <div>
              <Label htmlFor="end-date" optional>
                {copy.schedule.endDate}
              </Label>
              <input
                id="end-date"
                type="date"
                {...form.register('endDate')}
                disabled={dateIsTentative}
                className="event-input disabled:opacity-45"
              />
              <FieldError message={errors.endDate?.message} />
            </div>
            <div>
              <Label htmlFor="end-time" optional>
                {copy.schedule.endTime}
              </Label>
              <input
                id="end-time"
                type="time"
                {...form.register('endTime')}
                disabled={dateIsTentative}
                className="event-input disabled:opacity-45"
              />
            </div>
          </div>
          <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 border-t border-event-outline-subtle/60 pt-5 text-sm text-event-ink">
            <input
              type="checkbox"
              {...form.register('dateIsTentative')}
              className="event-checkbox"
            />
            {copy.schedule.dateTentative}
          </label>
        </fieldset>

        <div className="rounded-3xl border border-event-outline-subtle/60 bg-white/70 p-6 shadow-event-soft">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-event-muted">
            {copy.schedule.timezone}
          </p>
          <p className="mt-3 font-serif text-xl text-event-petrol">
            {copy.schedule.timezoneValue}
          </p>
          <div className="mt-8 rounded-2xl bg-event-petrol p-5 text-white">
            <Lightbulb className="h-5 w-5 text-event-gold" aria-hidden="true" />
            <p className="mt-4 text-sm italic leading-6 text-white/80">
              {copy.expertCopy}
            </p>
          </div>
        </div>
      </div>

      <fieldset className="mt-9">
        <legend className="mb-4 text-sm font-semibold text-event-ink">
          {copy.schedule.format}
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {formats.map(({ value, Icon }) => (
            <label
              key={value}
              className={cn(
                'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                format === value
                  ? 'border-event-gold bg-white shadow-event-selected'
                  : 'border-transparent bg-event-surface',
              )}
            >
              <input
                type="radio"
                value={value}
                {...form.register('format')}
                className="sr-only"
              />
              <Icon className="h-5 w-5 text-event-teal" aria-hidden="true" />
              <span className="font-semibold">{copy.schedule.formats[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="mb-4 font-serif text-2xl text-event-petrol">
          {copy.schedule.venueQuestion}
        </legend>
        <div className="grid gap-4 md:grid-cols-3">
          {venueModes.map(({ value, Icon }) => {
            const content = copy.schedule.venueModes[value];
            return (
              <label
                key={value}
                className={cn(
                  'relative flex min-h-44 cursor-pointer flex-col rounded-3xl border p-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                  venueMode === value
                    ? 'border-event-gold bg-white shadow-event-selected'
                    : 'border-transparent bg-event-surface',
                )}
              >
                <input
                  type="radio"
                  value={value}
                  {...form.register('venueMode')}
                  className="sr-only"
                />
                <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-event-background text-event-teal">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-event-ink">{content.label}</span>
                <span className="mt-2 text-sm leading-6 text-event-muted">
                  {content.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}

'use client';

import type {
  
  
  UseFormReturn
} from 'react-hook-form';
import { cn } from '@/shared/lib/utils';
import {
  eventCreationCopy as copy
  
} from '@/features/events/i18n/event-creation.copy';
import {
  EVENT_TYPES,
  
  type EventCreationFormValues
  
  
  
  
} from '@/features/events/lib/event-creation';
import { FieldError } from '../components/FieldError';
import { Label } from '../components/Label';
import { StepHeading } from '../components/StepHeading';
import {
  EVENT_TYPE_ICONS
  
  
} from '../components/step-constants';

interface InformationStepProps {
  form: UseFormReturn<EventCreationFormValues>;
}

export function InformationStep({ form }: InformationStepProps) {
  const selectedType = form.watch('eventType');
  const errors = form.formState.errors;

  return (
    <section>
      <StepHeading
        eyebrow={copy.information.eyebrow}
        title={copy.information.title}
        subtitle={copy.information.subtitle}
      />

      <div className="space-y-9">
        <div>
          <Label htmlFor="event-title">{copy.information.name}</Label>
          <input
            id="event-title"
            {...form.register('title')}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'event-title-error' : undefined}
            className="event-input text-lg"
            placeholder={copy.information.namePlaceholder}
          />
          <FieldError
            id="event-title-error"
            message={errors.title?.message}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-event-ink">
            {copy.information.type}
          </legend>
          <p className="mb-4 text-sm text-event-muted">
            {copy.information.typeHint}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {EVENT_TYPES.map((type) => {
              const Icon = EVENT_TYPE_ICONS[type];
              const selected = selectedType === type;
              return (
                <label
                  key={type}
                  className={cn(
                    'group relative flex min-h-28 cursor-pointer flex-col justify-between rounded-2xl p-4 transition-all duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                    selected
                      ? 'bg-white shadow-event-selected'
                      : 'bg-event-surface hover:-translate-y-0.5 hover:bg-white hover:shadow-event-soft motion-reduce:transform-none',
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    {...form.register('eventType')}
                    className="sr-only"
                  />
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      selected ? 'text-event-gold' : 'text-event-petrol',
                    )}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold leading-5 text-event-ink">
                    {copy.information.types[type]}
                  </span>
                </label>
              );
            })}
          </div>
          <FieldError message={errors.eventType?.message} />
        </fieldset>

        <div className="grid gap-5 md:grid-cols-[1fr_240px]">
          <div>
            <Label htmlFor="short-description" optional>
              {copy.information.shortDescription}
            </Label>
            <textarea
              id="short-description"
              {...form.register('shortDescription')}
              className="event-textarea"
              placeholder={copy.information.shortDescriptionPlaceholder}
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="capacity" optional>
              {copy.information.attendance}
            </Label>
            <div className="rounded-2xl bg-event-petrol p-5 text-white shadow-event-soft">
              <input
                id="capacity"
                type="number"
                min={1}
                inputMode="numeric"
                {...form.register('capacity')}
                aria-invalid={Boolean(errors.capacity)}
                className="w-full border-0 bg-transparent text-center font-serif text-4xl outline-none placeholder:text-white/35"
                placeholder="100"
              />
              <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
                {copy.information.attendanceHint}
              </p>
            </div>
            <FieldError message={errors.capacity?.message} />
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import {
  
  
  
  
  
  
  Check
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  eventCreationCopy as copy,
  formatEventCreationCopy
} from '@/features/events/i18n/event-creation.copy';
import {
  
  
  type EventCreationFormValues,
  type EventCreationStep,
  
  
  type ProviderNeedState
} from '@/features/events/lib/event-creation';
import type { EventPublishReadiness } from '@/features/events/services/events.service';
import { StepHeading } from '../components/StepHeading';

interface ReviewStepProps {
  values: EventCreationFormValues;
  providerNeeds: ProviderNeedState[];
  coverPreview?: string;
  onEdit: (step: EventCreationStep) => void;
  readiness?: EventPublishReadiness;
  readinessLoading?: boolean;
}

export function ReviewStep({
  values,
  providerNeeds,
  coverPreview,
  onEdit,
  readiness,
  readinessLoading
}: ReviewStepProps) {
  const venue =
    values.venueMode === 'later'
      ? copy.review.noVenue
      : values.venueName || copy.review.noVenue;
  const visibility = copy.identity.discoverabilityLabels[values.discoverability];
  const access = copy.identity.accessOptions[values.accessPolicyType];
  const admission = values.admissionModes
    .map((mode) => copy.identity.admissionOptions[mode])
    .join(' + ');
  const cards = [
    {
      title: copy.review.information,
      step: 1 as const,
      body: `${values.title} · ${copy.information.types[values.eventType]} · ${
        values.capacity || '—'
      }`
    },
    {
      title: copy.review.date,
      step: 2 as const,
      body: values.dateIsTentative
        ? copy.schedule.dateTentative
        : `${values.startDate} · ${values.startTime} · America/Toronto`
    },
    { title: copy.review.venue, step: 3 as const, body: venue },
    {
      title: copy.review.providers,
      step: 4 as const,
      body:
        providerNeeds.length > 0
          ? formatEventCreationCopy(copy.review.providersCount, {
              count: providerNeeds.length
            })
          : copy.review.providersLater
    },
    {
      title: copy.review.identity,
      step: 5 as const,
      body: coverPreview ? copy.identity.cover : copy.review.noCover
    },
    { title: copy.review.visibility, step: 5 as const, body: visibility },
    { title: copy.review.access, step: 5 as const, body: access },
    { title: copy.review.admission, step: 5 as const, body: admission },
  ];

  return (
    <section>
      <StepHeading
        eyebrow={copy.review.eyebrow}
        title={copy.review.title}
        subtitle={copy.review.subtitle}
      />

      <div className="rounded-3xl bg-event-surface p-5 sm:p-7">
        <h2 className="font-semibold text-event-ink">{copy.review.checklist}</h2>
        <div className={cn(
          'mt-4 rounded-2xl border px-4 py-4 text-sm',
          readiness?.publishable
            ? 'border-event-teal/30 bg-event-teal/10 text-event-petrol'
            : 'border-event-gold/40 bg-white text-event-ink',
        )}>
          <p className="font-semibold">
            {readinessLoading
              ? copy.review.readinessLoading
              : readiness?.publishable
                ? copy.review.publishReady
                : copy.review.publishNotReady}
          </p>
          {readiness && readiness.errors.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {Array.from(
                new Map(
                  readiness.errors.map((error) => [`${error.code}:${error.field}`, error]),
                ).values(),
              ).map(({ code, field }) => (
                <li key={`${code}:${field}`}>• {copy.review.readinessErrors[code as keyof typeof copy.review.readinessErrors] ?? code}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {[
            copy.review.essential,
            copy.review.dateItem,
            copy.review.visibilityItem,
          ].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full bg-event-teal/10 px-3 py-2 text-xs font-semibold text-event-petrol"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </span>
          ))}
          {[copy.review.venueItem, copy.review.providersItem, copy.review.ticketingItem].map(
            (label) => (
              <span
                key={label}
                className="rounded-full border border-event-outline-subtle bg-white px-3 py-2 text-xs font-semibold text-event-muted"
              >
                {label} · {copy.review.optionalItem}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <article
            key={`${card.title}-${card.step}`}
            className="rounded-3xl bg-white/75 p-5 shadow-event-soft"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-serif text-xl text-event-petrol">{card.title}</h3>
              <button
                type="button"
                onClick={() => onEdit(card.step)}
                className="min-h-10 rounded-xl px-3 text-xs font-semibold text-event-teal focus-visible:outline-2 focus-visible:outline-event-gold"
              >
                {copy.modify}
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-event-muted">{card.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-7 rounded-3xl bg-event-petrol p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <Check className="mt-1 h-5 w-5 text-event-gold" aria-hidden="true" />
          <div>
            <p className="font-semibold">{copy.review.allSaved}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              {copy.review.finalHelp}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

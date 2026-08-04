'use client';

import {
  
  
  
  
  
  
  
  
  
  
  
  Globe2,
  
  
  
  
  
  
  
  
  ShieldCheck,
  
  
  UsersRound
  
  
  
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
import type { MediaImage, MediaImageSource } from '@/shared/types/media.types';
import type { EventMediaState } from '@/features/events/services/event-media.service';
import { EventMediaManager } from '../EventMediaManager';
import { FieldError } from '../components/FieldError';
import { Label } from '../components/Label';
import { StepHeading } from '../components/StepHeading';

interface IdentityAccessStepProps {
  form: UseFormReturn<EventCreationFormValues>;
  eventId: string;
  coverImage?: MediaImageSource;
  gallery: MediaImage[];
  onMediaStateChange: (state: EventMediaState) => void;
  onCoverPreviewChange: (value?: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}

export function IdentityAccessStep({
  form,
  eventId,
  coverImage,
  gallery,
  onMediaStateChange,
  onCoverPreviewChange,
  onUploadingChange
}: IdentityAccessStepProps) {
  const discoverability = form.watch('discoverability');
  const accessPolicyType = form.watch('accessPolicyType');
  const admissionModes = form.watch('admissionModes');
  const visibilityOptions = [
    {
      value: 'public' as const,
      Icon: Globe2,
      content: copy.identity.public
    },
    {
      value: 'unlisted' as const,
      Icon: UsersRound,
      content: copy.identity.unlisted
    },
    {
      value: 'private' as const,
      Icon: ShieldCheck,
      content: copy.identity.private
    },
  ];
  const accessOptions = [
    'open',
    'registration_required',
    'access_code',
    'email_domain',
    'manual_approval',
    'guest_list',
    'invitation_token',
  ] as const;
  const admissionOptions = [
    'free',
    'registration_only',
    'free_ticket',
    'paid_ticket',
    'invitation',
  ] as const;

  return (
    <section>
      <StepHeading
        eyebrow={copy.identity.eyebrow}
        title={copy.identity.title}
        subtitle={copy.identity.subtitle}
      />

      <EventMediaManager
        eventId={eventId}
        coverImage={coverImage}
        gallery={gallery}
        onMediaStateChange={onMediaStateChange}
        onCoverPreviewChange={onCoverPreviewChange}
        onUploadingChange={onUploadingChange}
      />

      <div className="mt-12 border-t border-event-outline-subtle/70 pt-10">
        <Label htmlFor="event-description" optional>
          {copy.identity.description}
        </Label>
        <textarea
          id="event-description"
          {...form.register('description')}
          className="event-textarea min-h-40"
          placeholder={copy.identity.descriptionPlaceholder}
        />
      </div>

      <fieldset className="mt-10">
        <legend className="font-serif text-2xl text-event-petrol">
          {copy.identity.visibilityQuestion}
        </legend>
        <p className="mt-2 text-sm text-event-muted">
          {copy.identity.visibilityHint}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {visibilityOptions.map(({ value, Icon, content }) => (
            <label
              key={value}
              className={cn(
                'flex min-h-64 cursor-pointer flex-col rounded-3xl border p-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                discoverability === value
                  ? 'border-event-petrol bg-event-petrol text-white shadow-event-selected'
                  : 'border-transparent bg-event-surface text-event-ink',
              )}
            >
              <input
                type="radio"
                value={value}
                {...form.register('discoverability')}
                className="sr-only"
              />
              <Icon
                className={cn(
                  'h-6 w-6',
                  discoverability === value ? 'text-event-gold' : 'text-event-teal',
                )}
                aria-hidden="true"
              />
              <span className="mt-8 font-semibold">{content.label}</span>
              <span
                className={cn(
                  'mt-2 text-sm leading-6',
                  discoverability === value ? 'text-white/75' : 'text-event-muted',
                )}
              >
                {content.description}
              </span>
              <span
                className={cn(
                  'mt-auto pt-5 text-xs leading-5',
                  discoverability === value ? 'text-white/65' : 'text-event-muted',
                )}
              >
                {content.help}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8 rounded-3xl border border-event-outline-subtle/70 bg-white/70 p-5 shadow-event-soft sm:p-7">
        <legend className="px-1 font-serif text-2xl text-event-petrol">
          {copy.identity.accessQuestion}
        </legend>
        <p className="mt-2 text-sm text-event-muted">{copy.identity.accessHint}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {accessOptions.map((value) => (
            <label
              key={value}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition',
                accessPolicyType === value
                  ? 'border-event-gold bg-event-petrol text-white shadow-event-selected'
                  : 'border-event-outline-subtle bg-event-surface text-event-ink',
              )}
            >
              <input type="radio" value={value} {...form.register('accessPolicyType')} className="sr-only" />
              <span className={cn('h-2.5 w-2.5 rounded-full', accessPolicyType === value ? 'bg-event-gold' : 'bg-event-teal/40')} />
              {copy.identity.accessOptions[value]}
            </label>
          ))}
        </div>
        {/*
          Sans ce rendu, la combinaison « privé + accès ouvert » bloque le
          passage à l'étape suivante en silence : la validation échoue et le
          focus est renvoyé sur un `input` `sr-only`, donc invisible.
        */}
        <FieldError message={form.formState.errors.accessPolicyType?.message} />

        {accessPolicyType === 'access_code' && (
          <div className="mt-5">
            <Label htmlFor="event-access-code">{copy.identity.accessCode}</Label>
            <input
              id="event-access-code"
              type="password"
              autoComplete="new-password"
              {...form.register('accessCodeValue')}
              className="event-input"
              placeholder={copy.identity.accessCodePlaceholder}
            />
            <p className="mt-2 text-xs text-event-muted">{copy.identity.accessCodeHint}</p>
            <FieldError message={form.formState.errors.accessCodeValue?.message} />
          </div>
        )}

        {accessPolicyType === 'email_domain' && (
          <div className="mt-5">
            <Label htmlFor="allowed-domains">{copy.identity.emailDomain}</Label>
            <input
              id="allowed-domains"
              {...form.register('allowedDomains')}
              className="event-input"
              placeholder={copy.identity.emailDomainPlaceholder}
              aria-invalid={Boolean(form.formState.errors.allowedDomains)}
            />
            <p className="mt-2 text-xs text-event-muted">{copy.identity.emailDomainHint}</p>
            <FieldError message={form.formState.errors.allowedDomains?.message} />
          </div>
        )}
      </fieldset>

      <fieldset className="mt-8 rounded-3xl bg-event-surface p-5 sm:p-7">
        <legend className="px-1 font-serif text-2xl text-event-petrol">
          {copy.identity.admissionQuestion}
        </legend>
        <p className="mt-2 text-sm text-event-muted">{copy.identity.admissionHint}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {admissionOptions.map((value) => (
            <label key={value} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 text-sm font-semibold text-event-ink">
              <input
                type="checkbox"
                value={value}
                {...form.register('admissionModes')}
                className="event-checkbox"
              />
              <span>{copy.identity.admissionOptions[value]}</span>
            </label>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-event-teal/10 px-4 py-3 text-xs text-event-petrol">
          {copy.identity.admissionExample}
        </p>
        <FieldError message={form.formState.errors.admissionModes?.message} />
        <span className="sr-only">{admissionModes.join(', ')}</span>
      </fieldset>
    </section>
  );
}

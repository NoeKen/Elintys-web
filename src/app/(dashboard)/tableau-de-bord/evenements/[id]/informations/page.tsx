'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import { organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import { cn } from '@/shared/lib/utils';
import type { EventType, EventDiscoverability } from '@/features/events/types';

// ─── Zod schema ──────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  'conference', 'wedding', 'gala', 'concert', 'festival',
  'workshop', 'corporate', 'birthday', 'networking', 'other',
] as const satisfies readonly EventType[];

const DISCOVERABILITY_VALUES = ['public', 'unlisted', 'private'] as const satisfies readonly EventDiscoverability[];

const informationSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire.').max(200, 'Le titre ne peut pas dépasser 200 caractères.'),
  eventType: z.enum(EVENT_TYPES).optional(),
  shortDescription: z.string().max(500, 'La description courte ne peut pas dépasser 500 caractères.').optional(),
  description: z.string().max(5000, 'La description ne peut pas dépasser 5 000 caractères.').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timezone: z.string().optional(),
  dateIsTentative: z.boolean().optional(),
  discoverability: z.enum(DISCOVERABILITY_VALUES).optional(),
}).refine(
  (values) => !values.startDate || !values.endDate || new Date(values.endDate) >= new Date(values.startDate),
  { message: 'La date de fin doit suivre la date de début.', path: ['endDate'] },
);

type FormValues = z.infer<typeof informationSchema>;

function toLocalDateTimeValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
      {message}
    </p>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-event-soft">
      <h2 className="font-serif text-3xl text-event-petrol">{title}</h2>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-event-petrol">
      {children}
      {required && <span className="ml-1 text-terracotta-dark" aria-hidden="true">*</span>}
    </label>
  );
}

const inputClass = cn(
  'block w-full rounded-2xl border border-event-outline-subtle/40 bg-white px-4 py-3 text-sm text-event-petrol',
  'placeholder:text-event-muted/60',
  'focus:outline-none focus:ring-2 focus:ring-event-teal',
  'min-h-[44px]',
);

// ─── Page skeleton ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="premium-skeleton mb-8 h-28 rounded-3xl" />
      <div className="space-y-5">
        <div className="premium-skeleton h-64 rounded-3xl" />
        <div className="premium-skeleton h-48 rounded-3xl" />
        <div className="premium-skeleton h-56 rounded-3xl" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventInformationsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showSaved, setShowSaved] = useState(false);

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    staleTime: 30_000,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(informationSchema),
    defaultValues: {
      title: '',
      eventType: undefined,
      shortDescription: '',
      description: '',
      startDate: '',
      endDate: '',
      timezone: '',
      dateIsTentative: false,
      discoverability: 'public',
    },
  });

  useEffect(() => {
    if (event) {
      reset({
        title: event.title ?? '',
        eventType: event.eventType,
        shortDescription: event.shortDescription ?? '',
        description: event.description ?? '',
        startDate: event.startDate ? toLocalDateTimeValue(event.startDate) : '',
        endDate: event.endDate ? toLocalDateTimeValue(event.endDate) : '',
        timezone: event.timezone ?? '',
        dateIsTentative: event.dateIsTentative ?? false,
        discoverability: event.discoverability ?? 'public',
      });
    }
  }, [event, reset]);

  const { mutate, isPending, error: mutationError } = useMutation({
    mutationFn: (data: FormValues) =>
      eventsService.update(id, {
        title: data.title,
        eventType: data.eventType,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        startDate: toIsoDateTime(data.startDate),
        endDate: toIsoDateTime(data.endDate),
        timezone: data.timezone || undefined,
        dateIsTentative: data.dateIsTentative,
        discoverability: data.discoverability,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['event-publish-readiness', id] });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    mutate(data);
  };

  const discoverability = useWatch({ control, name: 'discoverability' });

  // ── Loading state ──
  if (isLoading) return <PageSkeleton />;

  // ── Error state ──
  if (isError || !event) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl bg-terracotta-pale/70 p-7 text-center shadow-event-soft">
          <h1 className="font-serif text-3xl text-event-petrol">{copy.workspace.informationLoadError}</h1>
          <button
            type="button"
            onClick={() => void refetch()}
            className="premium-button mt-5 min-h-[44px] px-6"
          >
            {copy.workspace.informationRetry}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <header className="mb-8 rounded-3xl bg-white p-6 shadow-event-soft sm:p-8">
        <p className="section-eyebrow mb-4">{copy.workspace.informationEyebrow}</p>
        <h1 className="font-serif text-[clamp(2rem,5vw,3.6rem)] leading-none text-event-petrol">
          {copy.workspace.informationHeading}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-event-muted">
          {copy.workspace.informationSubtitle.replace('{title}', event.title)}
        </p>
      </header>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* ── Section 1 — Identité de l'événement ── */}
        <SectionCard title={copy.workspace.informationSectionIdentity}>
          {/* Titre */}
          <div>
            <Label htmlFor="title" required>{copy.workspace.informationFieldTitle}</Label>
            <input
              id="title"
              type="text"
              maxLength={200}
              autoComplete="off"
              placeholder="Ex : Gala de bienfaisance Élintys 2026"
              className={cn(inputClass, 'mt-1.5', errors.title && 'border-red-400 ring-1 ring-red-400')}
              {...register('title')}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Type d'événement */}
          <div>
            <Label htmlFor="eventType">{copy.workspace.informationFieldType}</Label>
            <select
              id="eventType"
              className={cn(inputClass, 'mt-1.5 cursor-pointer')}
              {...register('eventType')}
            >
              <option value="">— Choisir un type —</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {copy.types[type]}
                </option>
              ))}
            </select>
            <FieldError message={errors.eventType?.message} />
          </div>

          {/* Description courte */}
          <div>
            <Label htmlFor="shortDescription">{copy.workspace.informationFieldShortDesc}</Label>
            <textarea
              id="shortDescription"
              rows={3}
              maxLength={500}
              placeholder="Une phrase mémorable qui résume l'événement."
              className={cn(inputClass, 'mt-1.5 resize-y')}
              {...register('shortDescription')}
            />
            <FieldError message={errors.shortDescription?.message} />
          </div>

          {/* Description complète */}
          <div>
            <Label htmlFor="description">{copy.workspace.informationFieldDesc}</Label>
            <textarea
              id="description"
              rows={7}
              maxLength={5000}
              placeholder="Décrivez le programme, l'ambiance et les moments forts de votre événement."
              className={cn(inputClass, 'mt-1.5 resize-y')}
              {...register('description')}
            />
            <FieldError message={errors.description?.message} />
          </div>
        </SectionCard>

        {/* ── Section 2 — Calendrier ── */}
        <SectionCard title={copy.workspace.informationSectionSchedule}>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Date de début */}
            <div>
              <Label htmlFor="startDate">{copy.workspace.informationFieldStartDate}</Label>
              <input
                id="startDate"
                type="datetime-local"
                className={cn(inputClass, 'mt-1.5')}
                {...register('startDate')}
              />
              <FieldError message={errors.startDate?.message} />
            </div>

            {/* Date de fin */}
            <div>
              <Label htmlFor="endDate">{copy.workspace.informationFieldEndDate}</Label>
              <input
                id="endDate"
                type="datetime-local"
                className={cn(inputClass, 'mt-1.5')}
                {...register('endDate')}
              />
              <FieldError message={errors.endDate?.message} />
            </div>
          </div>

          {/* Fuseau horaire */}
          <div>
            <Label htmlFor="timezone">{copy.workspace.informationFieldTimezone}</Label>
            <input
              id="timezone"
              type="text"
              placeholder="Ex : America/Toronto"
              className={cn(inputClass, 'mt-1.5')}
              {...register('timezone')}
            />
            <FieldError message={errors.timezone?.message} />
          </div>

          {/* Date provisoire */}
          <div className="flex min-h-[44px] items-start gap-3 rounded-2xl border border-event-outline-subtle/40 bg-event-surface px-4 py-3">
            <input
              id="dateIsTentative"
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-event-teal"
              {...register('dateIsTentative')}
            />
            <label htmlFor="dateIsTentative" className="cursor-pointer text-sm">
              <span className="font-semibold text-event-petrol">
                {copy.workspace.informationFieldTentative}
              </span>
              <span className="ml-2 text-event-muted">
                {copy.workspace.informationFieldTentativeHint}
              </span>
            </label>
          </div>
        </SectionCard>

        {/* ── Section 3 — Découvrabilité ── */}
        <SectionCard title={copy.workspace.informationSectionDiscoverability}>
          <fieldset>
            <legend className="sr-only">{copy.workspace.informationFieldDiscoverability}</legend>
            <div className="space-y-3">
              {DISCOVERABILITY_VALUES.map((value) => {
                const labelMap: Record<typeof value, string> = {
                  public: copy.workspace.informationPublic,
                  unlisted: copy.workspace.informationUnlisted,
                  private: copy.workspace.informationPrivate,
                };
                const descMap: Record<typeof value, string> = {
                  public: copy.workspace.informationPublicDesc,
                  unlisted: copy.workspace.informationUnlistedDesc,
                  private: copy.workspace.informationPrivateDesc,
                };
                const isSelected = discoverability === value;
                return (
                  <label
                    key={value}
                    htmlFor={`discoverability-${value}`}
                    className={cn(
                      'flex min-h-[44px] cursor-pointer items-start gap-4 rounded-2xl border px-5 py-4 transition-colors',
                      isSelected
                        ? 'border-event-teal bg-teal-pale'
                        : 'border-event-outline-subtle/40 bg-white hover:border-event-teal/40',
                    )}
                  >
                    <input
                      id={`discoverability-${value}`}
                      type="radio"
                      value={value}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-event-teal"
                      {...register('discoverability')}
                    />
                    <span>
                      <span className={cn('block text-sm font-bold', isSelected ? 'text-event-teal' : 'text-event-petrol')}>
                        {labelMap[value]}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-event-muted">
                        {descMap[value]}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </SectionCard>

        {/* ── Save bar ── */}
        <div className="sticky bottom-0 flex flex-col gap-3 rounded-3xl bg-white/90 p-4 shadow-event-panel backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {/* Mutation error */}
          {mutationError ? (
            <FormErrorAlert
              className="flex-1"
              error={getUserFacingError(mutationError, {
                fallback: copy.workspace.informationSaveError,
              })}
            />
          ) : null}

          {/* Success inline toast */}
          {showSaved && !mutationError ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-sage-dark">
              <Check size={16} aria-hidden="true" />
              {copy.workspace.informationSaved}
            </span>
          ) : null}

          {/* Spacer when nothing to show */}
          {!mutationError && !showSaved ? <span className="hidden sm:block" /> : null}

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="premium-button min-h-[44px] w-full px-8 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            {isPending ? 'Enregistrement…' : copy.workspace.informationSave}
          </button>
        </div>
      </form>
    </div>
  );
}

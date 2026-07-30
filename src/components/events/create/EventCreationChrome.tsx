'use client';

import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  Lightbulb,
  LoaderCircle,
  LogOut,
  RotateCw,
  UserRound,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  eventCreationCopy as copy,
  formatEventCreationCopy,
} from '@/features/events/i18n/event-creation.copy';
import {
  EVENT_STEPS,
  type EventCreationFormValues,
  type EventCreationStep,
  type ProviderNeedState,
} from '@/features/events/lib/event-creation';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const STEP_LABELS = [
  copy.steps.information,
  copy.steps.schedule,
  copy.steps.venue,
  copy.steps.providers,
  copy.steps.identity,
  copy.steps.review,
] as const;

interface AutosaveStatusProps {
  status: SaveStatus;
  lastSavedAt?: string;
  onRetry?: () => void;
}

export function AutosaveStatus({
  status,
  lastSavedAt,
  onRetry,
}: AutosaveStatusProps) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-event-muted">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        {copy.saving}
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        className="inline-flex items-center gap-2 text-xs font-semibold text-destructive"
        role="alert"
      >
        <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        {copy.saveError}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold"
          >
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            {copy.retry}
          </button>
        )}
      </span>
    );
  }

  if (lastSavedAt) {
    const time = new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(lastSavedAt));
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-event-muted">
        <Check className="h-3.5 w-3.5 text-event-teal" aria-hidden="true" />
        {status === 'saved'
          ? copy.draftSaved
          : formatEventCreationCopy(copy.savedAt, { time })}
      </span>
    );
  }

  return null;
}

interface EventCreationProgressProps {
  step: EventCreationStep;
  completedSteps: number[];
  onStepSelect: (step: EventCreationStep) => void;
}

export function EventCreationProgress({
  step,
  completedSteps,
  onStepSelect,
}: EventCreationProgressProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.16em] text-event-petrol">
        <span>
          {formatEventCreationCopy(copy.stepCounter, { current: step })}
        </span>
        <span className="hidden text-event-ink sm:inline">{STEP_LABELS[step - 1]}</span>
      </div>
      <nav
        className="flex gap-1.5"
        aria-label={formatEventCreationCopy(copy.stepCounter, {
          current: step,
        })}
      >
        {EVENT_STEPS.map((item) => {
          const canVisit = completedSteps.includes(item) || item === step;
          return (
            <button
              key={item}
              type="button"
              disabled={!canVisit}
              onClick={() => onStepSelect(item)}
              aria-label={`${item}. ${STEP_LABELS[item - 1]}`}
              aria-current={item === step ? 'step' : undefined}
              className={cn(
                'h-1.5 flex-1 overflow-hidden rounded-full bg-event-outline-subtle transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-event-gold',
                canVisit ? 'cursor-pointer' : 'cursor-default opacity-55',
              )}
            >
              <span
                className={cn(
                  'block h-full rounded-full bg-event-petrol transition-transform duration-300 motion-reduce:transition-none',
                  item <= step || completedSteps.includes(item)
                    ? 'translate-x-0'
                    : '-translate-x-full',
                )}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface EventCreationHeaderProps {
  step: EventCreationStep;
  completedSteps: number[];
  saveStatus: SaveStatus;
  lastSavedAt?: string;
  onSaveAndExit: () => void;
  onRetry: () => void;
  onStepSelect: (step: EventCreationStep) => void;
}

export function EventCreationHeader({
  step,
  completedSteps,
  saveStatus,
  lastSavedAt,
  onSaveAndExit,
  onRetry,
  onStepSelect,
}: EventCreationHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-event-outline-subtle/70 bg-event-background/90 backdrop-blur-xl">
      <div className="mx-auto grid min-h-[82px] max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:px-7 lg:grid-cols-[320px_minmax(360px,660px)_320px]">
        <div className="flex min-w-0 items-center gap-4">
          <span className="font-serif text-xl text-event-petrol">
            {copy.brand}
          </span>
          <span className="hidden h-8 w-px bg-event-outline-subtle sm:block" />
          <button
            type="button"
            onClick={onSaveAndExit}
            disabled={saveStatus === 'saving'}
            className="hidden min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-event-ink transition-colors hover:text-event-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold disabled:opacity-50 sm:inline-flex"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {copy.saveAndExit}
          </button>
        </div>

        <EventCreationProgress
          step={step}
          completedSteps={completedSteps}
          onStepSelect={onStepSelect}
        />

        <div className="flex items-center justify-end gap-4">
          <div className="hidden text-right xl:block">
            <p className="text-xs font-bold tracking-[0.08em] text-event-ink">
              {copy.details}
            </p>
            <AutosaveStatus
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              onRetry={onRetry}
            />
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-event-petrol text-white shadow-event-soft">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </header>
  );
}

interface EventCreationAsideProps {
  values: EventCreationFormValues;
  providerNeeds: ProviderNeedState[];
  coverPreview?: string;
}

export function EventCreationAside({
  values,
  providerNeeds,
  coverPreview,
}: EventCreationAsideProps) {
  const typeLabel = copy.information.types[values.eventType];
  const venue =
    values.venueMode === 'later'
      ? copy.review.noVenue
      : values.venueName || values.venueCity || copy.previewEmpty;

  return (
    <aside className="hidden border-l border-event-outline-subtle/60 bg-white/38 px-8 py-12 xl:block">
      <div className="sticky top-32 mx-auto max-w-[320px]">
        <div className="flex items-center gap-3 text-event-teal">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
          <h2 className="text-base font-semibold">{copy.expertTitle}</h2>
        </div>
        <p className="mt-6 text-sm leading-7 text-event-muted">
          {copy.expertCopy}
        </p>

        <div className="my-8 h-px bg-event-outline-subtle/70" />

        <h3 className="text-sm font-semibold text-event-ink">
          {copy.previewTitle}
        </h3>
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/80 bg-white/75 shadow-event-soft backdrop-blur-xl">
          <div className="relative aspect-[16/9] bg-event-surface">
            {coverPreview ? (
              <Image
                src={coverPreview}
                alt={copy.coverAlt}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-xs leading-5 text-event-muted">
                {copy.previewEmpty}
              </div>
            )}
          </div>
          <div className="space-y-3 p-5">
            <div>
              <p className="font-serif text-xl leading-tight text-event-petrol">
                {values.title || copy.information.namePlaceholder}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-event-teal">
                {typeLabel}
              </p>
            </div>
            <p className="line-clamp-2 text-xs leading-5 text-event-muted">
              {values.shortDescription || copy.previewEmpty}
            </p>
            <div className="space-y-2 border-t border-event-outline-subtle/70 pt-3 text-xs text-event-muted">
              <p className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-event-teal" aria-hidden="true" />
                {values.startDate || copy.schedule.dateTentative}
              </p>
              <p>{venue}</p>
              {providerNeeds.length > 0 && (
                <p>
                  {formatEventCreationCopy(copy.review.providersCount, {
                    count: providerNeeds.length,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface StepNavigationProps {
  step: EventCreationStep;
  isSaving: boolean;
  isUploading?: boolean;
  canGoBack: boolean;
  canSkip: boolean;
  venueMode: EventCreationFormValues['venueMode'];
  onBack: () => void;
  onContinue: () => void;
  onSkip: () => void;
  onSaveAndExit: () => void;
}

export function StepNavigation({
  step,
  isSaving,
  isUploading = false,
  canGoBack,
  canSkip,
  venueMode,
  onBack,
  onContinue,
  onSkip,
  onSaveAndExit,
}: StepNavigationProps) {
  const primaryLabel =
    step === 6
      ? copy.finish
      : step === 3 && venueMode === 'later'
        ? copy.venue.continueWithout
        : copy.continue;

  return (
    <footer className="sticky bottom-0 z-30 border-t border-event-outline-subtle/70 bg-event-background/92 px-5 py-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex max-w-[1460px] items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack || isSaving}
          aria-label={copy.back}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-event-ink transition-colors hover:bg-white/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold disabled:pointer-events-none disabled:opacity-35"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{copy.back}</span>
        </button>

        <button
          type="button"
          onClick={onSaveAndExit}
          disabled={isSaving}
          className="min-h-11 rounded-xl px-3 text-xs font-semibold text-event-muted underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold sm:hidden"
        >
          {copy.saveAndExit}
        </button>

        <div className="flex items-center gap-3">
          {canSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={isSaving}
              className="hidden min-h-12 rounded-2xl px-5 text-sm font-semibold text-event-muted transition-colors hover:bg-white/65 hover:text-event-petrol focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold disabled:opacity-50 sm:inline-flex sm:items-center"
            >
              {copy.skip}
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            disabled={isSaving}
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-event-petrol px-5 text-sm font-semibold text-white shadow-event-button transition-all duration-200 hover:-translate-y-0.5 hover:bg-event-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none sm:min-w-44"
          >
            {isSaving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>
                  {isUploading ? copy.identity.uploading : copy.saving}
                </span>
              </>
            ) : (
              <>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}

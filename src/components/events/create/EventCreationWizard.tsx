'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { slideInRight } from '@/lib/animations';
import { ApiClientError } from '@/shared/lib/api';
import { eventsService } from '@/features/events/services/events.service';
import type { EventMediaState } from '@/features/events/services/event-media.service';
import { vendorRequestsService } from '@/features/vendors/services/vendor-requests.service';
import { invitationsService } from '@/features/invitations/services/invitations.service';
import type { Event } from '@/features/events/types';
import { getMediaUrl } from '@/shared/lib/media';
import {
  buildStepPayload,
  eventCreationSchema,
  getDefaultEventCreationValues,
  getStepFieldNames,
  getNextStep,
  type EventCreationFormValues,
  type EventCreationStep,
  type ManualProviderDraft,
  type ProviderCategory,
  type ProviderNeedState,
} from '@/features/events/lib/event-creation';
import {
  EventCreationAside,
  EventCreationHeader,
  StepNavigation,
  type SaveStatus,
} from './EventCreationChrome';
import {
  IdentityAccessStep,
  InformationStep,
  ProvidersStep,
  ReviewStep,
  ScheduleStep,
  VenueStep,
  type ManualProviderMap,
  type SelectedVendorMap,
} from './EventCreationSteps';

interface EventCreationWizardProps {
  initialEvent?: Event;
}

interface SaveOptions {
  targetStep?: EventCreationStep;
  exit?: boolean;
  skip?: boolean;
}

export function EventCreationWizard({
  initialEvent,
}: EventCreationWizardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const initialStep = initialEvent ? getNextStep(initialEvent) : 1;
  const [event, setEvent] = useState<Event | undefined>(initialEvent);
  const [step, setStep] = useState<EventCreationStep>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>(
    initialEvent?.creationProgress?.completedSteps ?? [],
  );
  const [skippedSteps, setSkippedSteps] = useState<number[]>(
    initialEvent?.creationProgress?.skippedSteps ?? [],
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(
    initialEvent?.creationProgress?.lastSavedAt,
  );
  const [providerNeeds, setProviderNeeds] = useState<ProviderNeedState[]>(
    (initialEvent?.providerNeeds ?? []).map((need) => ({
      category: need.category as ProviderCategory,
      mode: need.mode,
    })),
  );
  const [manualProviders, setManualProviders] = useState<ManualProviderMap>({});
  const [selectedVendors, setSelectedVendors] =
    useState<SelectedVendorMap>({});
  const [persistedConnections, setPersistedConnections] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(
    getMediaUrl(initialEvent?.coverImage),
  );
  const [mediaUploading, setMediaUploading] = useState(false);
  const retryRef = useRef<() => Promise<void>>(async () => undefined);

  const form = useForm<EventCreationFormValues>({
    resolver: zodResolver(eventCreationSchema),
    defaultValues: getDefaultEventCreationValues(initialEvent),
    mode: 'onTouched',
  });
  const values = form.watch();
  const canGoBack = step > 1;

  const goToStep = (nextStep: EventCreationStep, eventId?: string) => {
    setStep(nextStep);
    const resolvedEventId = eventId ?? event?._id;
    const basePath = resolvedEventId
      ? `/tableau-de-bord/evenements/${resolvedEventId}/configuration`
      : '/evenements/creer';
    router.replace(`${basePath}?etape=${nextStep}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const persistProviderConnections = async (eventId: string) => {
    for (const need of providerNeeds) {
      const connectionKey = `${need.category}:${need.mode}`;
      if (persistedConnections.includes(connectionKey)) continue;

      if (need.mode === 'manual') {
        const draft = manualProviders[need.category];
        if (!draft?.name.trim()) continue;
        await vendorRequestsService.create(eventId, {
          source: 'manual',
          externalContact: {
            name: draft.name.trim(),
            category: need.category,
            ...(draft.email.trim() ? { email: draft.email.trim() } : {}),
            ...(draft.phone.trim() ? { phone: draft.phone.trim() } : {}),
          },
        });
        if (draft.invite && draft.email.trim()) {
          try {
            await invitationsService.create({
              email: draft.email.trim(),
              name: draft.name.trim(),
              type: 'vendor',
              category: need.category,
              eventId,
            });
          } catch (error) {
            if (!(error instanceof ApiClientError) || error.status !== 409) {
              throw error;
            }
          }
        }
      }

      if (need.mode === 'elintys' && selectedVendors[need.category]) {
        await vendorRequestsService.create(eventId, {
          vendorId: selectedVendors[need.category],
          source: 'platform',
        });
      }

      setPersistedConnections((current) => [
        ...new Set([...current, connectionKey]),
      ]);
    }
  };

  const saveCurrentStep = async ({
    targetStep,
    exit = false,
    skip = false,
  }: SaveOptions = {}) => {
    if (mediaUploading) return;
    const action = () => saveCurrentStep({ targetStep, exit, skip });
    retryRef.current = action;

    const fields = getStepFieldNames(step, form.getValues());
    const isValid =
      fields.length === 0 ? true : await form.trigger(fields, { shouldFocus: true });
    if (!isValid) return;

    setSaveStatus('saving');
    try {
      const nextStep = targetStep ?? (Math.min(step + 1, 6) as EventCreationStep);
      const nextCompleted = skip
        ? completedSteps.filter((item) => item !== step)
        : [...new Set([...completedSteps, step])];
      const nextSkipped = skip
        ? [...new Set([...skippedSteps, step])]
        : skippedSteps.filter((item) => item !== step);
      const payload = buildStepPayload(
        step,
        form.getValues(),
        providerNeeds,
        {
          currentStep: exit ? step : nextStep,
          completedSteps: nextCompleted,
          skippedSteps: nextSkipped,
        },
      );

      let savedEvent: Event;
      if (!event) {
        savedEvent = await eventsService.create({
          ...payload,
          title: form.getValues('title').trim(),
        });
      } else {
        if (step === 4) await persistProviderConnections(event._id);
        savedEvent = await eventsService.update(event._id, payload);
      }

      setEvent(savedEvent);
      if (step === 5) {
        setCoverPreview(getMediaUrl(savedEvent.coverImage));
      }
      setCompletedSteps(nextCompleted);
      setSkippedSteps(nextSkipped);
      setLastSavedAt(
        savedEvent.creationProgress?.lastSavedAt ?? new Date().toISOString(),
      );
      setSaveStatus('saved');
      form.reset(form.getValues());
      await queryClient.invalidateQueries({ queryKey: ['my-events'] });

      if (exit) {
        router.push('/tableau-de-bord');
        return;
      }

      if (step === 6) {
        router.push(`/tableau-de-bord/evenements/${savedEvent._id}`);
        return;
      }

      goToStep(nextStep, savedEvent._id);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleBack = async () => {
    if (step <= 1) return;
    await saveCurrentStep({
      targetStep: (step - 1) as EventCreationStep,
    });
  };

  const handleCoverPreviewChange = (value?: string) => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverPreview(value);
  };

  const handleMediaStateChange = (state: EventMediaState) => {
    setEvent((current) =>
      current
        ? {
            ...current,
            coverImage: state.coverImage ?? undefined,
            gallery: state.gallery,
          }
        : current,
    );
  };

  const renderCurrentStep = () => {
    if (step === 1) return <InformationStep form={form} />;
    if (step === 2) return <ScheduleStep form={form} />;
    if (step === 3) return <VenueStep form={form} />;
    if (step === 4) {
      return (
        <ProvidersStep
          providerNeeds={providerNeeds}
          onProviderNeedsChange={setProviderNeeds}
          manualProviders={manualProviders}
          onManualProvidersChange={setManualProviders}
          selectedVendors={selectedVendors}
          onSelectedVendorsChange={setSelectedVendors}
        />
      );
    }
    if (step === 5) {
      if (!event) return null;
      return (
        <IdentityAccessStep
          form={form}
          eventId={event._id}
          coverImage={event.coverImage}
          gallery={event.gallery ?? []}
          onMediaStateChange={handleMediaStateChange}
          onCoverPreviewChange={handleCoverPreviewChange}
          onUploadingChange={setMediaUploading}
        />
      );
    }
    return (
      <ReviewStep
        values={form.getValues()}
        providerNeeds={providerNeeds}
        coverPreview={coverPreview}
        onEdit={goToStep}
      />
    );
  };

  return (
    <div className="event-creation min-h-screen bg-event-background text-event-ink">
      <EventCreationHeader
        step={step}
        completedSteps={[...new Set([...completedSteps, ...skippedSteps])]}
        saveStatus={mediaUploading ? 'saving' : saveStatus}
        lastSavedAt={lastSavedAt}
        onSaveAndExit={() => void saveCurrentStep({ exit: true })}
        onRetry={() => void retryRef.current()}
        onStepSelect={goToStep}
      />

      <div className="mx-auto grid max-w-[1500px] xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="min-w-0 px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-[1000px] rounded-[24px] border border-white/80 bg-white/86 p-5 shadow-event-panel backdrop-blur-xl sm:p-8 lg:p-12">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                variants={prefersReducedMotion ? undefined : slideInRight}
                initial={prefersReducedMotion ? false : 'hidden'}
                animate="visible"
                exit="exit"
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <EventCreationAside
          values={values}
          providerNeeds={providerNeeds}
          coverPreview={coverPreview}
        />
      </div>

      <StepNavigation
        step={step}
        isSaving={saveStatus === 'saving' || mediaUploading}
        isUploading={mediaUploading}
        canGoBack={canGoBack}
        canSkip={step === 4}
        venueMode={values.venueMode}
        onBack={() => void handleBack()}
        onContinue={() => void saveCurrentStep()}
        onSkip={() => void saveCurrentStep({ skip: true })}
        onSaveAndExit={() => void saveCurrentStep({ exit: true })}
      />
    </div>
  );
}

export type { ManualProviderDraft };

'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { ApiClientError } from '@/shared/lib/api';
import { useAuth } from '@/shared/hooks/useAuth';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import { Modal } from '@/shared/ui/Modal';
import { getLoginPath } from '@/lib/auth/redirects';
import {
  useMyEventRegistrations,
  useRegisterForEvent,
} from '@/features/events/hooks/useEventRegistration';
import {
  getParticipationError,
  participationCopy as copy,
} from '@/features/events/lib/participation-error';

interface EventRegistrationActionProps {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  accessGrant?: string;
  accessSatisfied: boolean;
}

function registrationEventId(eventId: { _id: string } | string | null): string | undefined {
  if (!eventId) return undefined;
  return typeof eventId === 'string' ? eventId : eventId._id;
}

function shouldRotateKey(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false;
  return error.status >= 400 && error.status < 500 && error.status !== 429;
}

export function EventRegistrationAction({
  eventId,
  eventSlug,
  eventTitle,
  accessGrant,
  accessSatisfied,
}: EventRegistrationActionProps) {
  const { user, isLoading: authLoading } = useAuth();
  const registrations = useMyEventRegistrations(1, 100, Boolean(user));
  const registerMutation = useRegisterForEvent(eventId);
  const attemptKey = useRef<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const returnPath = `/evenements/${eventSlug}`;
  const registrationHref = `/inscription/etape-1?redirect=${encodeURIComponent(returnPath)}`;
  const existingRegistration = registrations.data?.data.find(
    (registration) => registrationEventId(registration.eventId) === eventId,
  );

  const submitRegistration = async () => {
    const idempotencyKey = attemptKey.current ?? crypto.randomUUID();
    attemptKey.current = idempotencyKey;
    try {
      await registerMutation.mutateAsync({ accessGrant, idempotencyKey });
      setConfirmed(true);
    } catch (error) {
      if (shouldRotateKey(error)) attemptKey.current = null;
    }
  };

  if (authLoading) {
    return (
      <div
        className="mt-5 h-12 w-full max-w-sm animate-pulse rounded-full bg-surface-low sm:w-72"
        aria-label={copy.registrationCheckLoading}
        aria-busy="true"
      />
    );
  }

  if (!user) {
    return (
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href={getLoginPath(returnPath)} className="premium-button min-h-12 px-6">
          {copy.signInToRegister}
        </Link>
        <Link
          href={registrationHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-outline px-6 text-sm font-bold text-navy transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {copy.createAccount}
        </Link>
      </div>
    );
  }

  if (registrations.isLoading) {
    return (
      <p className="mt-5 text-sm text-on-surface-variant" role="status">
        {copy.registrationCheckLoading}
      </p>
    );
  }

  if (registrations.isError) {
    return (
      <div className="mt-5" role="alert">
        <p className="text-sm text-destructive">{copy.registrationCheckError}</p>
        <button
          type="button"
          onClick={() => void registrations.refetch()}
          className="mt-2 min-h-11 cursor-pointer text-sm font-bold text-teal underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {copy.retry}
        </button>
      </div>
    );
  }

  if (existingRegistration || confirmed) {
    return (
      <div className="mt-5 rounded-2xl border border-teal/20 bg-teal/5 p-4" role="status">
        <p className="flex items-center gap-2 font-bold text-teal-dark">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          {copy.alreadyRegistered}
        </p>
        <Link
          href="/tableau-de-bord/participation"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-teal underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {copy.viewMyParticipation}
        </Link>
      </div>
    );
  }

  if (!accessSatisfied) {
    return <p className="mt-5 text-sm leading-6 text-on-surface-variant">{copy.registrationBlocked}</p>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="premium-button mt-5 min-h-12 cursor-pointer px-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        {copy.registerCta}
      </button>

      <Modal
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!registerMutation.isPending) setDialogOpen(open);
        }}
        title={copy.registerConfirmTitle}
        description={copy.registerConfirmDescription.replace('{event}', eventTitle)}
        className="mx-4 max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto"
      >
        {registerMutation.isError && (
          <FormErrorAlert error={getParticipationError(registerMutation.error)} className="mb-4" />
        )}
        <div className="flex flex-col-reverse gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            disabled={registerMutation.isPending}
            className="min-h-12 cursor-pointer rounded-full border border-outline px-5 text-sm font-bold text-navy transition-colors hover:border-teal disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copy.close}
          </button>
          <button
            type="button"
            onClick={() => void submitRegistration()}
            disabled={registerMutation.isPending}
            className="premium-button min-h-12 cursor-pointer px-5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registerMutation.isPending ? copy.registerPending : copy.registerConfirmAction}
          </button>
        </div>
      </Modal>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, KeyRound, MailCheck, ShieldCheck, Ticket } from 'lucide-react';
import { PurchaseModal } from '@/components/tickets/PurchaseModal';
import api, { ApiClientError } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { eventCreationCopy as wizardCopy } from '@/features/events/i18n/event-creation.copy';
import { publicEventCopy as copy } from '@/features/events/i18n/public-event.copy';
import type { PublicEventDetail, PublicEventTicketType } from '@/features/events/types';

interface Props {
  event: PublicEventDetail;
}

export function EventPageClient({ event }: Props) {
  const [selectedTicket, setSelectedTicket] = useState<PublicEventTicketType | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [accessGrant, setAccessGrant] = useState<string>();
  const [policyAuthorized, setPolicyAuthorized] = useState(false);
  const [accessFeedback, setAccessFeedback] = useState<string>();
  const [accessLoading, setAccessLoading] = useState(false);
  const policyType = event.accessPolicy.type;
  const hasTicketAdmission = event.admissionModes.some((mode) =>
    mode === 'free_ticket' || mode === 'paid_ticket',
  );
  const ticketAccessAllowed = policyType === 'open'
    || policyType === 'registration_required'
    || Boolean(accessGrant)
    || policyAuthorized;
  const registrationHref = `/inscription/etape-1?redirect=${encodeURIComponent(`/evenements/${event.slug}`)}`;

  const handleAccessAction = async () => {
    setAccessLoading(true);
    setAccessFeedback(undefined);
    try {
      if (policyType === 'access_code') {
        const response = await api.post<{ authorized: true; accessGrant: string }>(
          `/events/${event._id}/access/code/verify`,
          { code: accessCode },
        );
        setAccessGrant(response.data.accessGrant);
        setAccessFeedback(wizardCopy.identity.codeVerified);
      } else if (policyType === 'email_domain') {
        const response = await api.post<{ authorized: boolean; reason: string }>(
          `/events/${event._id}/access/domain/check`,
          {},
        );
        setPolicyAuthorized(response.data.authorized);
        setAccessFeedback(response.data.authorized
          ? wizardCopy.identity.domainVerified
          : wizardCopy.identity.domainDenied);
      } else if (policyType === 'manual_approval') {
        await api.post(`/events/${event._id}/access/request`, {});
        setAccessFeedback(wizardCopy.identity.requestSent);
      }
    } catch (error: unknown) {
      setAccessFeedback(
        policyType === 'access_code' && error instanceof ApiClientError && error.status === 403
          ? copy.codeInvalid
          : getUserFacingError(error, {
              fallback: wizardCopy.identity.accessActionError,
            }).message,
      );
    } finally {
      setAccessLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="public-event-action-card" aria-labelledby="event-access-title">
        <div className="flex items-start gap-3">
          <span className="public-event-icon-chip" aria-hidden="true">
            <ShieldCheck size={19} />
          </span>
          <div>
            <p className="section-eyebrow">{copy.access}</p>
            <h2 id="event-access-title" className="mt-2 font-serif text-2xl text-navy-dark">
              {wizardCopy.identity.publicAccessDescriptions[policyType]}
            </h2>
          </div>
        </div>

        {policyType === 'open' && (
          <p className="mt-5 text-sm leading-6 text-on-surface-variant">{copy.openNote}</p>
        )}

        {policyType === 'access_code' && !accessGrant && (
          <form
            className="mt-5 space-y-3"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              void handleAccessAction();
            }}
          >
            <label className="block text-sm font-bold text-on-surface" htmlFor="public-event-access-code">
              {copy.codeLabel}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-teal" aria-hidden="true" />
                <input
                  id="public-event-access-code"
                  type="password"
                  autoComplete="one-time-code"
                  value={accessCode}
                  onChange={(inputEvent) => setAccessCode(inputEvent.target.value)}
                  className="event-input min-h-12 w-full pl-11"
                  placeholder={copy.codePlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={accessLoading || accessCode.length < 6}
                className="premium-button min-h-12 px-6 disabled:opacity-50"
              >
                {wizardCopy.identity.publicCtas.enterCode}
              </button>
            </div>
          </form>
        )}

        {policyType === 'email_domain' && (
          <div className="mt-5">
            <p className="mb-3 text-sm leading-6 text-on-surface-variant">{copy.authMayBeRequired}</p>
            <button type="button" onClick={handleAccessAction} disabled={accessLoading} className="premium-button min-h-12 px-6 disabled:opacity-50">
              <MailCheck size={17} aria-hidden="true" />
              {wizardCopy.identity.publicCtas.verifyEmail}
            </button>
          </div>
        )}

        {policyType === 'manual_approval' && (
          <div className="mt-5">
            <p className="mb-3 text-sm leading-6 text-on-surface-variant">{copy.authMayBeRequired}</p>
            <button type="button" onClick={handleAccessAction} disabled={accessLoading} className="premium-button min-h-12 px-6 disabled:opacity-50">
              {wizardCopy.identity.publicCtas.request}
            </button>
          </div>
        )}

        {policyType === 'registration_required' && (
          <Link href={registrationHref} className="premium-button mt-5 min-h-12 px-6">
            {wizardCopy.identity.publicCtas.register}
          </Link>
        )}

        {policyType === 'guest_list' && (
          <p className="mt-5 text-sm leading-6 text-on-surface-variant">{copy.guestListNote}</p>
        )}

        {policyType === 'invitation_token' && (
          <div className="mt-5">
            <p className="mb-3 text-sm leading-6 text-on-surface-variant">{copy.invitationNote}</p>
            <Link href="/invitation" className="premium-button min-h-12 px-6">
              {wizardCopy.identity.publicCtas.useInvitation}
            </Link>
          </div>
        )}

        {policyType === 'open' && event.admissionModes.includes('registration_only') && !hasTicketAdmission && (
          <Link href={registrationHref} className="premium-button mt-5 min-h-12 px-6">
            {wizardCopy.identity.publicCtas.register}
          </Link>
        )}

        {(accessGrant || policyAuthorized) && (
          <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-event-teal" role="status">
            <Check size={17} aria-hidden="true" />
            {copy.accessReady}
          </p>
        )}
        {accessFeedback && (
          <p className="mt-4 text-sm font-medium leading-6 text-event-petrol" role="status" aria-live="polite">
            {accessFeedback}
          </p>
        )}
      </section>

      {hasTicketAdmission && (
        <section id="billets" className="public-event-action-card scroll-mt-28" aria-labelledby="event-tickets-title">
          <div className="flex items-start gap-3">
            <span className="public-event-icon-chip public-event-icon-chip-warm" aria-hidden="true">
              <Ticket size={19} />
            </span>
            <div>
              <p className="section-eyebrow">{copy.admission}</p>
              <h2 id="event-tickets-title" className="mt-2 font-serif text-2xl text-navy-dark">{copy.tickets}</h2>
            </div>
          </div>

          {event.ticketTypes.length === 0 ? (
            <p className="mt-5 text-sm leading-6 text-on-surface-variant">{copy.ticketsUnavailable}</p>
          ) : (
            <div className="mt-5 space-y-3">
              {event.ticketTypes.map((ticketType) => {
                const available = Math.max(0, ticketType.quantity - ticketType.sold);
                const disabled = available === 0 || !ticketAccessAllowed;
                return (
                  <div key={ticketType._id} className="ticket-card">
                    <div>
                      <p className="font-bold text-on-surface">{ticketType.name}</p>
                      {ticketType.description && <p className="mt-1 text-sm leading-6 text-on-surface-variant">{ticketType.description}</p>}
                      <p className={cn('mt-2 text-sm', available === 0 ? 'text-destructive' : 'text-on-surface-variant')}>
                        {available === 0 ? copy.soldOut : copy.available.replace('{count}', String(available))}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-lg font-extrabold text-navy">
                        {ticketType.isFree ? copy.free : `${(ticketType.price / 100).toFixed(2)} $ CAD`}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticketType)}
                        disabled={disabled}
                        className={cn(
                          'mt-3 min-h-11 rounded-full px-5 text-sm font-bold transition',
                          disabled
                            ? 'cursor-not-allowed border border-outline-variant bg-surface-low text-on-surface-variant'
                            : 'premium-button px-5 py-2',
                        )}
                      >
                        {available === 0 ? copy.soldOut : copy.choose}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {selectedTicket && (
        <PurchaseModal
          ticketType={selectedTicket}
          eventTitle={event.title}
          accessGrant={accessGrant}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}

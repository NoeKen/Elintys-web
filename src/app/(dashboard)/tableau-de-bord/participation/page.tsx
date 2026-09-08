'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Inbox, Ticket, UsersRound } from 'lucide-react';
import api from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { useMyEventRegistrations } from '@/features/events/hooks/useEventRegistration';
import frMessages from '../../../../../messages/fr.json';

const copy = frMessages.participation;
const journeyCopy = frMessages.participantJourney;

interface ReceivedInvitation {
  _id: string;
  name: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  event?: { title?: string; slug?: string; startDate?: string };
}

interface PaginatedInvitations {
  data: ReceivedInvitation[];
  total: number;
  page: number;
  limit: number;
}

interface TicketPurchase {
  _id: string;
  event?: { title?: string; startDate?: string; slug?: string } | string;
  ticketType?: { name?: string; isFree?: boolean } | string;
  status: string;
  price: number;
  createdAt: string;
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function LoadingRows({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      {[1, 2].map((item) => (
        <div key={item} className="h-24 animate-pulse rounded-2xl bg-surface-low" />
      ))}
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="rounded-2xl bg-destructive/8 p-4" role="alert">
      <p className="text-sm text-destructive">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-2 min-h-11 cursor-pointer text-sm font-bold text-teal underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        {copy.retry}
      </button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-white/65 p-6 text-center shadow-card">
      <p className="font-bold text-navy">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>
      <Link
        href="/evenements"
        className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-teal underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        {copy.discoverEvents}
      </Link>
    </div>
  );
}

export default function ParticipationPage() {
  const registrations = useMyEventRegistrations(1, 100);
  const invitations = useQuery({
    queryKey: ['invitations-received', 1],
    queryFn: () => api.get<PaginatedInvitations>('/invitations/received', {
      params: { page: 1, limit: 25 },
    }).then((response) => response.data),
    staleTime: 30_000,
  });
  const tickets = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get<TicketPurchase[]>('/tickets/my').then((response) => response.data),
    staleTime: 30_000,
  });

  const registrationItems = registrations.data?.data ?? [];
  const invitationItems = invitations.data?.data ?? [];
  const ticketItems = tickets.data ?? [];
  const totalItems = (registrations.data?.total ?? 0) + (invitations.data?.total ?? 0) + ticketItems.length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10" data-testid="participation-page">
      <header className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,92,94,0.12),rgba(255,248,239,0.94)_55%,rgba(198,105,78,0.12))] px-5 py-7 shadow-card sm:px-8 sm:py-9">
        <p className="section-eyebrow">{copy.navLabel}</p>
        <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl leading-tight text-navy-dark sm:text-4xl">{copy.spaceTitle}</h1>
            <p className="mt-3 text-base leading-7 text-on-surface-variant">{copy.spaceSubtitle}</p>
          </div>
          <div className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full border border-teal/15 bg-white/75 px-4 text-sm font-bold text-teal-dark">
            <UsersRound className="h-4 w-4" aria-hidden="true" />
            {copy.countLabel.replace('{count}', String(totalItems))}
          </div>
        </div>
      </header>

      <nav className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2" aria-label={copy.spaceTitle}>
        {[
          ['#inscriptions', copy.sectionRegistrations],
          ['#invitations', copy.sectionInvitations],
          ['#billets', copy.sectionTickets],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 shrink-0 snap-start items-center rounded-full border border-outline bg-white px-4 text-sm font-bold text-navy transition-colors hover:border-teal hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {label}
          </Link>
        ))}
      </nav>

      <section id="inscriptions" className="mt-6 scroll-mt-6 rounded-[1.75rem] bg-white/80 p-5 shadow-card sm:p-7" aria-labelledby="registrations-title">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/10 text-teal" aria-hidden="true">
            <CalendarDays className="h-5 w-5" />
          </span>
          <h2 id="registrations-title" className="font-serif text-2xl text-navy-dark">{copy.sectionRegistrations}</h2>
        </div>
        {registrations.isLoading ? <LoadingRows label={copy.registrationsLoading} /> : null}
        {registrations.isError ? <ErrorState message={copy.registrationsError} retry={() => void registrations.refetch()} /> : null}
        {!registrations.isLoading && !registrations.isError && registrationItems.length === 0 ? (
          <EmptyState title={copy.registrationsEmptyTitle} description={copy.registrationsEmptyDescription} />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2" role="list" aria-label={copy.registrationsListLabel}>
          {registrationItems.map((registration) => {
            const event = typeof registration.eventId === 'object' ? registration.eventId : undefined;
            const registrationDate = formatDate(registration.createdAt);
            return (
              <article key={registration._id} className="rounded-2xl bg-surface-low/55 p-4" role="listitem">
                {event?.slug ? (
                  <Link href={`/evenements/${event.slug}`} className="font-bold text-navy transition-colors hover:text-teal">
                    {event.title}
                  </Link>
                ) : (
                  <p className="font-bold text-navy">{journeyCopy.eventFallback}</p>
                )}
                {event?.startDate && <p className="mt-2 text-sm text-on-surface-variant">{formatDate(event.startDate)}</p>}
                {registrationDate && <p className="mt-2 text-xs text-on-surface-variant">{copy.registeredOn.replace('{date}', registrationDate)}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section id="invitations" className="scroll-mt-6 rounded-[1.75rem] bg-white/80 p-5 shadow-card sm:p-7" aria-labelledby="invitations-title">
          <div className="mb-5 flex items-center gap-3">
            <Inbox className="h-6 w-6 text-terracotta" aria-hidden="true" />
            <h2 id="invitations-title" className="font-serif text-2xl text-navy-dark">{copy.sectionInvitations}</h2>
          </div>
          {invitations.isLoading ? <LoadingRows label={copy.invitationsLoading} /> : null}
          {invitations.isError ? <ErrorState message={copy.invitationsError} retry={() => void invitations.refetch()} /> : null}
          {!invitations.isLoading && !invitations.isError && invitationItems.length === 0 ? (
            <EmptyState title={copy.invitationsEmptyTitle} description={copy.invitationsEmptyDescription} />
          ) : null}
          <div className="space-y-3" role="list" aria-label={copy.invitationsListLabel}>
            {invitationItems.map((invitation) => (
              <article key={invitation._id} className="rounded-2xl bg-surface-low/45 p-4" role="listitem">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-navy">{invitation.event?.title ?? invitation.name}</p>
                  <span className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
                    invitation.status === 'accepted' ? 'bg-teal/10 text-teal-dark' : 'bg-amber/10 text-amber',
                  )}>
                    {invitation.status === 'accepted' ? journeyCopy.statusAccepted : journeyCopy.statusPending}
                  </span>
                </div>
                {invitation.event?.slug && (
                  <Link href={`/evenements/${invitation.event.slug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-teal underline">
                    {copy.viewEvent}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="billets" className="scroll-mt-6 rounded-[1.75rem] bg-white/80 p-5 shadow-card sm:p-7" aria-labelledby="tickets-title">
          <div className="mb-5 flex items-center gap-3">
            <Ticket className="h-6 w-6 text-gold" aria-hidden="true" />
            <h2 id="tickets-title" className="font-serif text-2xl text-navy-dark">{copy.sectionTickets}</h2>
          </div>
          {tickets.isLoading ? <LoadingRows label={copy.ticketsLoading} /> : null}
          {tickets.isError ? <ErrorState message={copy.ticketsError} retry={() => void tickets.refetch()} /> : null}
          {!tickets.isLoading && !tickets.isError && ticketItems.length === 0 ? (
            <EmptyState title={copy.ticketsEmptyTitle} description={copy.ticketsEmptyDescription} />
          ) : null}
          <div className="space-y-3" role="list" aria-label={copy.ticketsListLabel}>
            {ticketItems.map((ticket) => {
              const event = typeof ticket.event === 'object' ? ticket.event : undefined;
              const ticketType = typeof ticket.ticketType === 'object' ? ticket.ticketType : undefined;
              return (
                <article key={ticket._id} className="rounded-2xl bg-surface-low/45 p-4" role="listitem">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-navy">{event?.title ?? journeyCopy.eventFallback}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{ticketType?.name ?? journeyCopy.ticketTypeFallback}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal-dark">
                      {ticket.status === 'valid' ? journeyCopy.statusValid : ticket.status}
                    </span>
                  </div>
                  {event?.slug && (
                    <Link href={`/evenements/${event.slug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-teal underline">
                      {copy.viewEvent}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

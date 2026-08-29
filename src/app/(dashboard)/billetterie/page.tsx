'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ExternalLink, Ticket } from 'lucide-react';
import api from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import frMessages from '../../../../messages/fr.json';

const copy = frMessages.participantJourney;

interface TicketPurchase {
  _id: string;
  event?: { title?: string; startDate?: string; slug?: string } | string;
  ticketType?: { name?: string; isFree?: boolean } | string;
  status: string;
  price: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  valid: copy.statusValid,
  used: copy.statusUsed,
  refunded: copy.statusRefunded,
  pending: copy.statusPending,
  cancelled: copy.statusCancelled,
};

const STATUS_COLORS: Record<string, string> = {
  valid: 'bg-teal/15 text-teal-dark',
  used: 'bg-surface-low text-muted',
  refunded: 'bg-amber/15 text-amber',
  pending: 'bg-amber/15 text-amber',
  cancelled: 'bg-destructive/10 text-destructive',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BilletteriePage() {
  const { data: tickets = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get<TicketPurchase[]>('/tickets/my').then((response) => response.data),
    staleTime: 30_000,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8" data-testid="billetterie-page">
      <div className="mb-6 flex items-center gap-3">
        <Ticket className="h-6 w-6 text-teal" aria-hidden="true" />
        <h1 className="font-serif text-2xl font-bold text-navy">{copy.ticketsTitle}</h1>
      </div>

      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label={copy.ticketsLoading}>
          {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-surface-low" />)}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4" role="alert">
          <p className="text-sm text-destructive">{copy.ticketsError}</p>
          <button type="button" onClick={() => void refetch()} className="mt-2 min-h-11 text-sm font-medium text-teal underline">
            {copy.retry}
          </button>
        </div>
      )}

      {!isLoading && !isError && tickets.length === 0 && (
        <div className="rounded-xl border border-border bg-white p-8 text-center" data-testid="empty-state">
          <Ticket className="mx-auto mb-3 h-10 w-10 text-muted" aria-hidden="true" />
          <p className="font-medium text-navy">{copy.ticketsEmptyTitle}</p>
          <p className="mt-1 text-sm text-muted">{copy.ticketsEmptyDescription}</p>
          <Link href="/evenements" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-teal underline">
            {copy.discoverEvents}
          </Link>
        </div>
      )}

      <div className="space-y-3" role="list" aria-label={copy.ticketsListLabel}>
        {tickets.map((ticket) => {
          const event = typeof ticket.event === 'object' ? ticket.event : undefined;
          const ticketType = typeof ticket.ticketType === 'object' ? ticket.ticketType : undefined;
          return (
            <article key={ticket._id} className="rounded-xl border border-border bg-white p-4" role="listitem" data-testid="ticket-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {event?.slug ? (
                    <Link href={`/evenements/${event.slug}`} className="group inline-flex items-center gap-1 font-semibold text-navy hover:text-teal" data-testid="ticket-event-link">
                      <span className="truncate">{event.title ?? copy.eventFallback}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </Link>
                  ) : <p className="font-semibold text-navy">{event?.title ?? copy.eventFallback}</p>}
                  <p className="mt-0.5 text-sm text-muted" data-testid="ticket-type-name">{ticketType?.name ?? copy.ticketTypeFallback}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[ticket.status] ?? 'bg-surface-low text-muted')} data-testid="ticket-status">
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {event?.startDate && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatDate(event.startDate)}</span>}
                <span data-testid="ticket-price">{ticketType?.isFree || ticket.price === 0 ? copy.free : `${(ticket.price / 100).toFixed(2)} $ CAD`}</span>
                <span>{copy.purchasedOn.replace('{date}', formatDate(ticket.createdAt))}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

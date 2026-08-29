'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Inbox, MailCheck, MailX, Clock } from 'lucide-react';
import api from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import frMessages from '../../../../../messages/fr.json';

const copy = frMessages.participantJourney;

interface ReceivedInvitation {
  _id: string;
  email: string;
  name: string;
  type: string;
  status: 'pending' | 'accepted' | 'expired';
  maxUses: number;
  useCount: number;
  expiresAt: string;
  createdAt: string;
  event?: {
    _id: string;
    title: string;
    slug: string;
    startDate?: string;
  };
}

interface PaginatedInvitations {
  data: ReceivedInvitation[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_CONFIG = {
  pending: {
    label: copy.statusPending,
    color: 'bg-amber/15 text-amber',
    Icon: Clock,
  },
  accepted: {
    label: copy.statusAccepted,
    color: 'bg-teal/15 text-teal-dark',
    Icon: MailCheck,
  },
  expired: {
    label: copy.statusExpired,
    color: 'bg-surface-low text-muted',
    Icon: MailX,
  },
} as const;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function InvitationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invitations-received', page],
    queryFn: () => api.get<PaginatedInvitations>(`/invitations/received?page=${page}&limit=25`).then((r) => r.data),
    staleTime: 30_000,
  });

  const invitations = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" data-testid="invitations-page">
      <div className="mb-6 flex items-center gap-3">
        <Inbox className="h-6 w-6 text-teal" aria-hidden="true" />
        <h1 className="font-serif text-2xl font-bold text-navy">{copy.invitationsTitle}</h1>
      </div>

      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label={copy.invitationsLoading}>
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-low" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4" role="alert">
          <p className="text-sm text-destructive">{copy.invitationsError}</p>
          <button type="button" onClick={() => void refetch()} className="mt-2 text-sm font-medium text-teal underline">
            {copy.retry}
          </button>
        </div>
      )}

      {!isLoading && !isError && invitations.length === 0 && (
        <div className="rounded-xl border border-border bg-white p-8 text-center" data-testid="empty-state">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted" aria-hidden="true" />
          <p className="font-medium text-navy">{copy.invitationsEmptyTitle}</p>
          <p className="mt-1 text-sm text-muted">{copy.invitationsEmptyDescription}</p>
          <Link href="/evenements" className="mt-4 inline-block text-sm font-medium text-teal underline">
            {copy.discoverEvents}
          </Link>
        </div>
      )}

      <div className="space-y-3" role="list" aria-label={copy.invitationsListLabel}>
        {invitations.map((inv: ReceivedInvitation) => {
          const isExpired = inv.status === 'expired' || new Date(inv.expiresAt) < new Date();
          const effectiveStatus = isExpired ? 'expired' : inv.status;
          const config = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.expired;
          const StatusIcon = config.Icon;

          return (
            <article
              key={inv._id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
              role="listitem"
              data-testid="invitation-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy" data-testid="invitation-name">
                      {inv.event?.title ?? inv.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{copy.participantInvitation}</p>
                  </div>
                  <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', config.color)} data-testid="invitation-status">
                    <StatusIcon className="h-3 w-3" aria-hidden="true" />
                    {config.label}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {copy.receivedOn.replace('{date}', formatDate(inv.createdAt))}
                  </span>
                  {!isExpired && <span>{copy.expiresOn.replace('{date}', formatDate(inv.expiresAt))}</span>}
                </div>

                {inv.status === 'pending' && !isExpired && (
                  <p className="mt-3 rounded-lg bg-amber/10 px-3 py-2 text-xs leading-5 text-amber" role="note">
                    {copy.checkEmail}
                  </p>
                )}

                {inv.status === 'accepted' && inv.event?.slug && (
                  <Link href={`/evenements/${inv.event.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal underline">
                    {copy.viewEvent}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {data && data.total > data.limit && (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label={copy.paginationLabel}>
          <button
            type="button"
            className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy disabled:opacity-40"
            disabled={page === 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {copy.previous}
          </button>
          <p className="text-sm text-muted" aria-live="polite">
            {copy.pageCount.replace('{page}', String(page)).replace('{total}', String(Math.ceil(data.total / data.limit)))}
          </p>
          <button
            type="button"
            className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy disabled:opacity-40"
            disabled={page >= Math.ceil(data.total / data.limit) || isLoading}
            onClick={() => setPage((current) => current + 1)}
          >
            {copy.next}
          </button>
        </nav>
      )}
    </div>
  );
}

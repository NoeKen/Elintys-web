'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import {
  notificationsService,
  type AppNotification,
} from '@/features/notifications/services/notifications.service';
import { notificationKeys } from '@/features/notifications/query-keys';

const TYPE_LABELS: Record<string, string> = {
  VENDOR_RESPONDED: 'Réponse prestataire',
  VENDOR_REQUEST_RECEIVED: 'Nouvelle demande',
  TICKET_SOLD: 'Billet vendu',
  VENUE_CONFIRMED: 'Lieu confirmé',
  INVITATION_ACCEPTED: 'Invitation acceptée',
  EVENT_REMINDER: 'Rappel événement',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const countQuery = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.countUnread(),
    refetchInterval: 30_000,
  });

  const notificationsQuery = useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationsService.list(),
    enabled: open,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const unread = countQuery.data?.count ?? 0;
  const badgeLabel = unread > 9 ? '9+' : String(unread);

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls="notifications-panel"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'relative flex items-center justify-center rounded-md p-2 transition-colors',
          'text-on-surface-variant hover:bg-surface-low hover:text-on-surface',
        )}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unread > 0 && (
          <span
            className={cn(
              'absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center',
              'rounded-full bg-teal px-1 text-[10px] font-bold text-white',
            )}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notifications-panel"
          className={cn(
            'absolute bottom-full left-0 z-50 mb-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl',
            'bg-white shadow-event-panel',
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-navy">Notifications</span>
            {unread > 0 && !countQuery.isError && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="min-h-11 text-xs font-medium text-teal hover:underline disabled:cursor-wait disabled:opacity-50"
              >
                {markAllMutation.isPending ? 'Mise à jour…' : 'Tout marquer lu'}
              </button>
            )}
          </div>

          {markAllMutation.isError ? (
            <p className="mx-4 mt-3 rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive" role="alert">
              Impossible de marquer les notifications comme lues. Réessayez.
            </p>
          ) : null}

          <ul className="max-h-72 overflow-y-auto" aria-live="polite" aria-busy={notificationsQuery.isLoading || notificationsQuery.isFetching}>
            {notificationsQuery.isLoading ? (
              <li className="px-4 py-6 text-center text-sm text-muted">
                Chargement des notifications…
              </li>
            ) : notificationsQuery.isError ? (
              <li className="px-4 py-5 text-center text-sm text-muted" role="alert">
                <p>Les notifications sont temporairement indisponibles.</p>
                <button
                  type="button"
                  onClick={() => void notificationsQuery.refetch()}
                  disabled={notificationsQuery.isFetching}
                  className="mt-3 min-h-11 rounded-full bg-surface-low px-4 font-semibold text-teal disabled:cursor-wait disabled:opacity-50"
                >
                  {notificationsQuery.isFetching ? 'Nouvel essai…' : 'Réessayer'}
                </button>
              </li>
            ) : !notificationsQuery.data || notificationsQuery.data.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted">
                Aucune notification.
              </li>
            ) : (
              notificationsQuery.data.map((notif: AppNotification) => (
                <li
                  key={notif._id}
                  className={cn(
                    'border-b border-border px-4 py-3 last:border-b-0',
                    !notif.read && 'bg-teal-pale',
                  )}
                >
                  <p className="text-xs font-medium text-navy">
                    {TYPE_LABELS[notif.type] ?? notif.type}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{formatDate(notif.createdAt)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

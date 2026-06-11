'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import { useAuthToken } from '@/server/auth/use-auth-token';
import {
  notificationsService,
  type AppNotification,
} from '@/features/notifications/services/notifications.service';

const TYPE_LABELS: Record<string, string> = {
  VENDOR_RESPONDED: 'Réponse prestataire',
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
  const token = useAuthToken();
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => notificationsService.countUnread(token),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifs', open],
    queryFn: () => notificationsService.list(token),
    enabled: open && !!token,
  });

  const { mutate: markAll } = useMutation({
    mutationFn: () => notificationsService.markAllRead(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      void queryClient.invalidateQueries({ queryKey: ['notifs'] });
    },
  });

  const unread = countData?.count ?? 0;
  const badgeLabel = unread > 9 ? '9+' : String(unread);

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
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
          className={cn(
            'absolute bottom-full left-0 z-50 mb-2 w-80 rounded-lg border border-border',
            'bg-white shadow-lg',
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-navy">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll()}
                className="text-xs font-medium text-teal hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted">
                Aucune notification.
              </li>
            ) : (
              notifications.map((notif: AppNotification) => (
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

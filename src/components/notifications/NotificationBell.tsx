'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import {
  notificationsService,
  type AppNotification,
} from '@/features/notifications/services/notifications.service';
import { notificationKeys } from '@/features/notifications/query-keys';
import messages from '../../../messages/fr.json';

const copy = messages.notifications;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function getString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' ? value : null;
}

/** Resolve destinations from server-owned notification types and validated IDs only. */
function getNotificationDestination(notification: AppNotification): string | null {
  const eventId = getString(notification.payload, 'eventId');

  switch (notification.type) {
    case 'VENDOR_REQUEST_RECEIVED':
      return '/tableau-de-bord/prestataire/demandes';
    case 'VENUE_BOOKING_RECEIVED':
      return '/tableau-de-bord/gestionnaire/reservations';
    case 'VENDOR_RESPONDED':
      return eventId && OBJECT_ID_PATTERN.test(eventId)
        ? `/tableau-de-bord/evenements/${eventId}/prestataires`
        : null;
    case 'VENUE_CONFIRMED':
      return eventId && OBJECT_ID_PATTERN.test(eventId)
        ? `/tableau-de-bord/evenements/${eventId}/lieux`
        : null;
    case 'INVITATION_ACCEPTED':
      return eventId && OBJECT_ID_PATTERN.test(eventId)
        ? `/tableau-de-bord/evenements/${eventId}/invites`
        : null;
    case 'TICKET_SOLD':
      return eventId && OBJECT_ID_PATTERN.test(eventId)
        ? `/tableau-de-bord/evenements/${eventId}/billetterie`
        : null;
    default:
      return null;
  }
}

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
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
      queryClient.setQueryData(notificationKeys.unreadCount(), { count: 0 });
      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: [...notificationKeys.all, 'list'] },
        (current) => current?.map((notification) => ({ ...notification, read: true })),
      );
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: [...notificationKeys.all, 'list'] },
        (current) =>
        current?.map((notification) =>
          notification._id === id ? { ...notification, read: true } : notification,
        ),
      );
      queryClient.setQueryData<{ count: number }>(notificationKeys.unreadCount(), (current) =>
        current ? { count: Math.max(0, current.count - 1) } : current,
      );
    },
  });

  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const unread = countQuery.data?.count ?? 0;
  const badgeLabel = unread > 9 ? '9+' : String(unread);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        aria-label={countQuery.isError ? copy.unavailable : copy.title}
        aria-expanded={open}
        aria-controls="notifications-panel"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'relative flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 transition-colors',
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
          ref={panelRef}
          id="notifications-panel"
          role="dialog"
          aria-label={copy.title}
          tabIndex={-1}
          className={cn(
            'fixed left-1/2 top-20 z-50 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl sm:left-auto sm:right-3 sm:translate-x-0',
            'bg-white shadow-event-panel outline-none',
          )}
        >
          <div className="flex items-center justify-between border-b border-border/35 px-4 py-3">
            <span className="text-sm font-semibold text-navy">{copy.title}</span>
            {unread > 0 && !countQuery.isError && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="min-h-11 text-xs font-medium text-teal hover:underline disabled:cursor-wait disabled:opacity-50"
              >
                {markAllMutation.isPending ? copy.markingAll : copy.markAll}
              </button>
            )}
          </div>

          {markAllMutation.isError ? (
            <p className="mx-4 mt-3 rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive" role="alert">
              {copy.markAllError}
            </p>
          ) : null}

          {markReadMutation.isError ? (
            <p className="mx-4 mt-3 rounded-xl bg-destructive/8 px-3 py-2 text-xs text-destructive" role="alert">
              {copy.markOneError}
            </p>
          ) : null}

          <ul className="max-h-72 overflow-y-auto" aria-live="polite" aria-busy={notificationsQuery.isLoading || notificationsQuery.isFetching}>
            {notificationsQuery.isLoading ? (
              <li className="px-4 py-6 text-center text-sm text-muted">
                {copy.loading}
              </li>
            ) : notificationsQuery.isError ? (
              <li className="px-4 py-5 text-center text-sm text-muted" role="alert">
                <p>{copy.listError}</p>
                <button
                  type="button"
                  onClick={() => void notificationsQuery.refetch()}
                  disabled={notificationsQuery.isFetching}
                  className="mt-3 min-h-11 rounded-full bg-surface-low px-4 font-semibold text-teal disabled:cursor-wait disabled:opacity-50"
                >
                  {notificationsQuery.isFetching ? copy.retrying : copy.retry}
                </button>
              </li>
            ) : !notificationsQuery.data || notificationsQuery.data.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted">
                {copy.empty}
              </li>
            ) : (
              notificationsQuery.data.map((notif: AppNotification) => (
                <li key={notif._id} className="border-b border-border/35 last:border-b-0">
                  <button
                    type="button"
                    aria-label={`${copy.types[notif.type] ?? notif.type} — ${formatDate(notif.createdAt)}${!notif.read ? ` — ${copy.unread}` : ''}`}
                    disabled={markReadMutation.isPending && markReadMutation.variables === notif._id}
                    onClick={() => {
                      if (!notif.read) markReadMutation.mutate(notif._id);
                      const destination = getNotificationDestination(notif);
                      if (destination) {
                        setOpen(false);
                        router.push(destination);
                      }
                    }}
                    className={cn(
                      'min-h-14 w-full px-4 py-3 text-left transition-colors hover:bg-surface-low disabled:cursor-wait disabled:opacity-70',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal',
                      !notif.read && 'bg-teal-pale',
                    )}
                  >
                    <span className="block text-xs font-medium text-navy">
                      {copy.types[notif.type] ?? notif.type}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{formatDate(notif.createdAt)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

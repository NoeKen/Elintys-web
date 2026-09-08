'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Image as ImageIcon, Info, LayoutGrid, MapPin, Settings, ShieldCheck, Ticket, Users, UsersRound } from 'lucide-react';
import type { ComponentType } from 'react';
import { eventsService } from '@/features/events/services/events.service';
import { organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import { cn } from '@/shared/lib/utils';
import type { MediaImageSource } from '@/shared/types/media.types';
import { ApiClientError } from '@/shared/lib/api';

interface WorkspaceShellProps { children: React.ReactNode; }

const ITEMS: Array<{ label: string; suffix: string; icon: ComponentType<{ size?: number; className?: string }> }> = [
  { label: copy.workspace.overview, suffix: '', icon: LayoutGrid },
  { label: copy.workspace.information, suffix: 'informations', icon: Info },
  { label: copy.workspace.venue, suffix: 'lieux', icon: MapPin },
  { label: copy.workspace.providers, suffix: 'prestataires', icon: UsersRound },
  { label: copy.workspace.access, suffix: 'acces-et-inscriptions', icon: ShieldCheck },
  { label: copy.workspace.ticketing, suffix: 'billetterie', icon: Ticket },
  { label: copy.workspace.invitations, suffix: 'invites', icon: Users },
  { label: copy.workspace.media, suffix: 'medias', icon: ImageIcon },
  { label: copy.workspace.settings, suffix: 'parametres', icon: Settings },
];

const STATUS_LABELS: Record<string, string> = {
  draft: copy.workspace.statusDraft,
  published: copy.workspace.statusPublished,
  completed: copy.workspace.statusCompleted,
  cancelled: copy.workspace.statusCancelled,
  ongoing: copy.workspace.statusOngoing,
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: 'bg-terracotta-pale text-terracotta-dark',
  published: 'bg-sage-pale text-sage-dark',
  completed: 'bg-event-surface text-event-muted',
  cancelled: 'bg-red-50 text-red-700',
  ongoing: 'bg-sage-pale text-sage-dark',
};

function getCoverUrl(coverImage: MediaImageSource | undefined): string | null {
  if (!coverImage) return null;
  if (typeof coverImage === 'string') return coverImage;
  return coverImage.url ?? null;
}

export function getWorkspaceErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 403) return copy.workspace.forbidden;
    if (error.status === 404) return copy.workspace.notFound;
  }
  return copy.workspace.loadError;
}

function CoverThumbnail({ coverImage, title }: { coverImage: MediaImageSource | undefined; title: string }) {
  const url = getCoverUrl(coverImage);
  if (url) {
    return (
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg shadow-[var(--shadow-soft-line)]">
        <Image src={url} alt={title} fill className="object-cover" sizes="32px" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-event-teal/20 text-event-teal" aria-hidden="true">
      <ImageIcon size={16} />
    </div>
  );
}

export function EventWorkspaceShell({ children }: WorkspaceShellProps) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['event', id], queryFn: () => eventsService.get(id), staleTime: 30_000 });
  const readiness = useQuery({ queryKey: ['event-publish-readiness', id], queryFn: () => eventsService.getPublishReadiness(id), enabled: Boolean(query.data), staleTime: 15_000 });
  const publishMutation = useMutation({
    mutationFn: () => eventsService.publish(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['my-events'] });
    },
  });
  const base = `/tableau-de-bord/evenements/${id}`;
  const event = query.data;

  const statusBadgeClass = event ? (STATUS_BADGE_CLASSES[event.status] ?? 'bg-event-surface text-event-muted') : '';
  const isPublishDisabled = !readiness.data?.publishable || event?.status === 'published' || publishMutation.isPending;

  if (query.isLoading) {
    return (
      <div
        className="mx-auto flex min-h-64 max-w-[1500px] items-center justify-center rounded-3xl bg-white/70 px-6 text-sm font-semibold text-event-muted shadow-event-panel backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        {copy.workspace.loadingStatus}…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-[1500px] rounded-3xl bg-white/70 p-4 shadow-event-panel backdrop-blur-xl sm:p-6">
        <div className="rounded-2xl bg-terracotta-pale px-4 py-5 text-sm text-destructive" role="alert">
          <p>{getWorkspaceErrorMessage(query.error)}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="mt-3 min-h-11 rounded-full bg-white/80 px-4 font-bold text-event-petrol disabled:cursor-wait disabled:opacity-50"
          >
            {query.isFetching ? `${copy.workspace.retry}…` : copy.workspace.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] overflow-hidden rounded-3xl bg-white/70 shadow-event-panel backdrop-blur-xl">
      <header className="flex flex-col gap-4 border-b border-event-outline-subtle/45 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/tableau-de-bord/evenements"
            aria-label={copy.workspace.back}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-event-surface text-event-petrol"
          >
            <ArrowLeft size={18} />
          </Link>
          <CoverThumbnail coverImage={event?.coverImage} title={event?.title ?? copy.workspace.eventFallback} />
          <div className="min-w-0">
            <p className="truncate font-serif text-xl text-event-petrol">{event?.title ?? copy.workspace.eventFallback}</p>
            <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]', statusBadgeClass)}>
              {event ? (STATUS_LABELS[event.status] ?? event.status) : copy.workspace.loadingStatus}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className="flex flex-wrap gap-2">
            {event?.slug && event.status === 'published' ? (
              <Link
                href={`/evenements/${event.slug}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-event-surface px-4 text-sm font-bold text-event-petrol"
              >
                <Eye size={16} />
                {copy.workspace.preview}
              </Link>
            ) : null}
            <button
              type="button"
              disabled={isPublishDisabled}
              onClick={() => { if (!isPublishDisabled) publishMutation.mutate(); }}
              className="premium-button min-h-[44px] px-5 disabled:cursor-not-allowed disabled:opacity-45"
              title={readiness.isError ? copy.workspace.readinessUnavailable : undefined}
            >
              {event?.status === 'published' ? copy.workspace.publishedAction : publishMutation.isPending ? copy.workspace.publishing : copy.workspace.publish}
            </button>
          </div>
          {readiness.isError ? (
            <p className="text-sm text-terracotta-dark" role="status">{copy.workspace.readinessUnavailable}</p>
          ) : null}
          {publishMutation.isError ? (
            <p className="text-sm text-destructive" role="alert">{copy.workspace.publishError}</p>
          ) : null}
        </div>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-event-outline-subtle/45 p-3 lg:border-b-0 lg:border-r lg:p-4">
          <nav className="flex max-w-full gap-2 overflow-x-auto lg:flex-col" aria-label={copy.workspace.navigationLabel}>
            {ITEMS.map((item) => {
              const href = item.suffix ? `${base}/${item.suffix}` : base;
              const active = item.suffix === '' ? pathname === base : pathname.startsWith(`${base}/${item.suffix}`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={href}
                  className={cn(
                    'flex min-h-[44px] min-w-[120px] shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors lg:w-full lg:min-w-0',
                    active
                      ? 'bg-event-petrol text-white shadow-event-button'
                      : 'text-event-muted hover:bg-event-surface hover:text-event-petrol',
                  )}
                >
                  <Icon size={17} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 bg-event-background/70">{children}</div>
      </div>
    </div>
  );
}

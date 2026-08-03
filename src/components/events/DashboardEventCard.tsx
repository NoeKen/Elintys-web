import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarDays, Clock3, MapPin } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Event } from '@/features/events/types';
import {
  getCompletionPercent,
  getNextStep,
} from '@/features/events/lib/event-creation';
import {
  eventCreationCopy as copy,
  formatEventCreationCopy,
} from '@/features/events/i18n/event-creation.copy';
import { getOptimizedMediaUrl } from '@/shared/lib/media';

const STATUS_LABELS: Record<string, string> = {
  draft: copy.dashboard.statuses.draft,
  published: copy.dashboard.statuses.published,
  cancelled: copy.dashboard.statuses.cancelled,
  completed: copy.dashboard.statuses.completed,
  ongoing: copy.dashboard.statuses.ongoing,
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gold-pale text-gold-dark',
  published: 'bg-teal-pale text-teal-dark',
  cancelled: 'bg-terracotta-pale text-terracotta-dark',
  completed: 'bg-sage-pale text-sage-dark',
  ongoing: 'bg-teal-pale text-teal-dark',
};

interface Props {
  event: Event;
  priority?: boolean;
}

export function DashboardEventCard({ event, priority = false }: Props) {
  const cover = event.coverImage
    ? getOptimizedMediaUrl(event.coverImage, 'card')
    : undefined;
  const date = event.startDate
    ? new Date(event.startDate).toLocaleDateString('fr-CA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const isDraft = event.status === 'draft';
  const nextStep = getNextStep(event);
  const progress = getCompletionPercent(event);
  const stepLabels = [
    copy.steps.information,
    copy.steps.schedule,
    copy.steps.venue,
    copy.steps.providers,
    copy.steps.identity,
    copy.steps.review,
  ];
  const href = isDraft
    ? `/tableau-de-bord/evenements/${event._id}/configuration?etape=${nextStep}`
    : `/tableau-de-bord/evenements/${event._id}`;
  const relativeUpdated = formatRelativeDate(event.updatedAt);

  return (
    <Link href={href} className="group block">
      <article className="premium-card cursor-pointer p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-premium">
        <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-low">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <span className="flex h-full items-center justify-center font-serif text-5xl text-teal/45" aria-hidden="true">
              E
            </span>
          )}
        </div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 flex-1 font-serif text-2xl leading-tight text-navy-dark">{event.title}</h3>
          <span
            className={cn(
              'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold',
              STATUS_COLORS[event.status] ?? 'bg-surface text-on-surface-variant'
            )}
          >
            {STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>
        <div className="space-y-2 text-sm text-on-surface-variant">
          {date && (
            <p className="flex items-center gap-2">
              <CalendarDays size={15} aria-hidden="true" className="text-teal" />
              {date}
            </p>
          )}
          {event.location && (
            <p className="flex items-center gap-2">
              <MapPin size={15} aria-hidden="true" className="text-terracotta" />
              {event.location.type === 'online'
                ? copy.dashboard.online
                : event.location.city ?? event.location.address ?? ''}
            </p>
          )}
        </div>
        {isDraft && (
          <div className="mt-5 rounded-2xl bg-surface-low p-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-navy">
                {formatEventCreationCopy(copy.dashboard.step, {
                  current: nextStep,
                })}
              </span>
              <span className="font-semibold text-teal-dark">
                {formatEventCreationCopy(copy.dashboard.progress, {
                  percent: progress,
                })}
              </span>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-outline-variant/40"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="block h-full rounded-full bg-teal"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
              <Clock3 size={13} aria-hidden="true" />
              {formatEventCreationCopy(copy.dashboard.updated, {
                relative: relativeUpdated,
              })}
            </p>
            <p className="mt-1 text-xs italic text-on-surface-variant">
              {formatEventCreationCopy(copy.dashboard.next, {
                step: stepLabels[nextStep - 1],
              })}
            </p>
          </div>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-outline-variant/60 pt-4">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant">
            {isDraft ? copy.dashboard.continue : copy.dashboard.open}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-pale text-teal transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={15} aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function formatRelativeDate(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return copy.dashboard.justNow;
  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - timestamp) / 60_000),
  );
  if (diffMinutes < 2) return copy.dashboard.justNow;
  if (diffMinutes < 60) {
    return formatEventCreationCopy(copy.dashboard.minutesAgo, {
      count: diffMinutes,
    });
  }
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) {
    return formatEventCreationCopy(copy.dashboard.hoursAgo, { count: hours });
  }
  return formatEventCreationCopy(copy.dashboard.daysAgo, {
    count: Math.round(hours / 24),
  });
}

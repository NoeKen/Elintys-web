import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import type { Event } from '@/features/events/types';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  cancelled: 'Annulé',
  completed: 'Terminé',
  ongoing: 'En cours',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber/20 text-amber',
  published: 'bg-teal/20 text-teal',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-surface text-muted',
  ongoing: 'bg-teal/20 text-teal',
};

interface Props {
  event: Event;
}

export function DashboardEventCard({ event }: Props) {
  const date = new Date(event.startDate).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link href={`/tableau-de-bord/evenements/${event._id}`}>
      <article className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-navy line-clamp-2 flex-1">{event.title}</h3>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full whitespace-nowrap',
              STATUS_COLORS[event.status] ?? 'bg-surface text-muted'
            )}
          >
            {STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>
        <p className="text-sm text-muted">{date}</p>
        {event.location && (
          <p className="text-sm text-muted">
            {event.location.type === 'online'
              ? 'En ligne'
              : event.location.city ?? event.location.address ?? ''}
          </p>
        )}
      </article>
    </Link>
  );
}

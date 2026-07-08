import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
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
  draft: 'bg-gold-pale text-gold-dark',
  published: 'bg-teal-pale text-teal-dark',
  cancelled: 'bg-terracotta-pale text-terracotta-dark',
  completed: 'bg-sage-pale text-sage-dark',
  ongoing: 'bg-teal-pale text-teal-dark',
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
    <Link href={`/tableau-de-bord/evenements/${event._id}`} className="group block">
      <article className="premium-card cursor-pointer p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-premium">
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
          <p className="flex items-center gap-2">
            <CalendarDays size={15} aria-hidden="true" className="text-teal" />
            {date}
          </p>
          {event.location && (
            <p className="flex items-center gap-2">
              <MapPin size={15} aria-hidden="true" className="text-terracotta" />
              {event.location.type === 'online'
                ? 'En ligne'
                : event.location.city ?? event.location.address ?? ''}
            </p>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-outline-variant/60 pt-4">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant">
            Ouvrir
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-pale text-teal transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={15} aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}

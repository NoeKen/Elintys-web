'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { eventsService } from '@/features/events/services/events.service';
import { DashboardEventCard } from '@/components/events/DashboardEventCard';
import type { Event } from '@/features/events/types';

export default function TableauDeBordPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => eventsService.getMyEvents(),
    staleTime: 30_000,
  });

  const events: Event[] = data?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-2xl font-bold text-navy">Mes événements</h1>
        <Link
          href="/evenements/creer"
          className="bg-teal text-white px-4 py-2 rounded-lg hover:bg-teal/90 text-sm font-medium transition-colors"
        >
          + Créer un événement
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border border-border rounded-xl p-4 h-24 animate-pulse bg-surface" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-red-500 text-sm">Impossible de charger les événements.</p>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted mb-4">Aucun événement pour l&apos;instant.</p>
          <Link href="/evenements/creer" className="text-teal hover:underline text-sm font-medium">
            Créer votre premier événement →
          </Link>
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event: Event) => (
            <DashboardEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

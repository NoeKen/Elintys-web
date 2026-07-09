'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CalendarPlus, Sparkles } from 'lucide-react';
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
    <div className="mx-auto max-w-6xl px-2 py-6 sm:px-4">
      <div className="glass-card mb-6 overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-eyebrow mb-4">Tableau de bord</p>
            <h1 className="font-serif text-[clamp(34px,5vw,56px)] leading-tight text-navy-dark">
              Mes événements
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Retrouvez vos événements, préparez vos prochaines publications et gardez une vue claire
              sur votre activité.
            </p>
          </div>
          <Link
            href="/evenements/creer"
            className="premium-button min-h-12 px-5"
          >
            <CalendarPlus size={17} aria-hidden="true" />
            Créer un événement
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="premium-skeleton h-36 rounded-2xl border border-outline-variant/60" />
          ))}
        </div>
      )}

      {isError && (
        <div className="premium-card p-5 text-sm font-medium text-destructive">
          Impossible de charger les événements.
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="glass-card py-14 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-pale text-teal">
            <Sparkles size={22} aria-hidden="true" />
          </div>
          <h2 className="font-serif text-3xl text-navy-dark">Aucun événement pour l&apos;instant.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
            Créez votre premier événement et commencez à connecter invités, billetterie et partenaires.
          </p>
          <Link href="/evenements/creer" className="premium-button mt-6">
            <CalendarPlus size={17} aria-hidden="true" />
            Créer votre premier événement
          </Link>
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event: Event) => (
            <DashboardEventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

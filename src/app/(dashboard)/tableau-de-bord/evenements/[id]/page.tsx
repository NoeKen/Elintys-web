'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { eventsService } from '@/features/events/services/events.service';
import type { Event } from '@/features/events/types';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  cancelled: 'Annulé',
  completed: 'Terminé',
  ongoing: 'En cours',
};

export default function EventDashboardPage() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading, isError } = useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    staleTime: 30_000,
  });

  if (isLoading) return <div className="p-8 text-muted animate-pulse">Chargement…</div>;
  if (isError || !event) return <div className="p-8 text-red-500">Événement introuvable.</div>;

  const sections = [
    { label: 'Billetterie', href: `/tableau-de-bord/evenements/${id}/billetterie`, description: 'Types de billets, ventes' },
    { label: 'Prestataires', href: `/tableau-de-bord/evenements/${id}/prestataires`, description: 'Demandes envoyées' },
    { label: 'Lieux', href: `/tableau-de-bord/evenements/${id}/lieux`, description: 'Réservations de salle' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-serif text-2xl font-bold text-navy">{event.title}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-muted border border-border">
            {STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>
        <p className="text-muted text-sm">
          {new Date(event.startDate).toLocaleDateString('fr-CA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {event.location ? ` · ${event.location}` : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map(s => (
          <Link key={s.href} href={s.href}>
            <article className="border border-border rounded-xl p-5 hover:shadow-md transition-shadow bg-white cursor-pointer">
              <p className="font-semibold text-navy mb-1">{s.label}</p>
              <p className="text-sm text-muted">{s.description}</p>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

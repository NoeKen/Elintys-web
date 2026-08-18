'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ExternalLink, MapPin } from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import { venueBookingsService, type VenueBooking } from '@/features/venues/services/venue-bookings.service';
import { cn } from '@/shared/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmé', refused: 'Refusé', cancelled: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-sage-pale text-sage-dark',
  refused: 'bg-red-100 text-red-700',
  cancelled: 'bg-event-surface text-event-muted',
};

export default function EventLieuxPage() {
  const { id } = useParams<{ id: string }>();
  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    staleTime: 30_000,
  });
  const bookingsQuery = useQuery({
    queryKey: ['venue-bookings', id],
    queryFn: () => venueBookingsService.listByEvent(id),
    staleTime: 30_000,
  });

  if (eventQuery.isLoading || bookingsQuery.isLoading) {
    return <div className="p-6"><div className="premium-skeleton h-80 rounded-3xl" /></div>;
  }

  if (eventQuery.isError || bookingsQuery.isError || !eventQuery.data) {
    return (
      <section className="m-6 rounded-3xl border border-destructive/20 bg-white p-7 text-center">
        <AlertCircle className="mx-auto text-destructive" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-3xl text-event-petrol">Impossible de charger le lieu</h1>
        <button
          type="button"
          onClick={() => { void eventQuery.refetch(); void bookingsQuery.refetch(); }}
          className="premium-button mt-5 min-h-[44px] px-6"
        >
          Réessayer
        </button>
      </section>
    );
  }

  const event = eventQuery.data;
  const location = event.location;
  const bookings = bookingsQuery.data ?? [];
  const locationDetails = [location?.address, location?.city, location?.province, location?.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="section-eyebrow mb-3">Logistique</p>
        <h1 className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] leading-none text-event-petrol">Lieu</h1>
        <p className="mt-3 text-event-muted">{event.title}</p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-event-soft sm:p-8" aria-labelledby="current-location">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-pale text-event-teal" aria-hidden="true">
              <MapPin size={22} />
            </span>
            <div>
              <h2 id="current-location" className="font-serif text-2xl text-event-petrol">Lieu associé</h2>
              {location ? (
                <div className="mt-3 space-y-1 text-sm text-event-muted">
                  <p className="font-bold text-event-petrol">{location.name || (location.type === 'online' ? 'Événement en ligne' : 'Lieu à compléter')}</p>
                  {locationDetails ? <p>{locationDetails}</p> : null}
                  {location.onlineUrl ? (
                    <a href={location.onlineUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 text-event-teal underline-offset-4 hover:underline">
                      Ouvrir le lien en ligne <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-event-muted">Aucun lieu n’est encore associé à cet événement.</p>
              )}
            </div>
          </div>
          <Link href="/lieux" className="premium-button-secondary inline-flex min-h-[44px] shrink-0 items-center rounded-full px-5 text-sm font-bold">
            Explorer les lieux
          </Link>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-event-soft" aria-labelledby="venue-requests">
        <h2 id="venue-requests" className="font-serif text-2xl text-event-petrol">Demandes de réservation</h2>
        {bookings.length === 0 ? (
          <p className="py-8 text-sm text-event-muted">Aucune demande de réservation pour cet événement.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {bookings.map((booking: VenueBooking) => {
              const venueName = typeof booking.venue === 'object' && booking.venue
                ? booking.venue.name ?? 'Salle'
                : 'Salle';
              const start = new Date(booking.bookingStart).toLocaleDateString('fr-CA');
              const end = new Date(booking.bookingEnd).toLocaleDateString('fr-CA');
              return (
                <li key={booking._id} className="flex flex-col gap-3 rounded-2xl border border-event-outline-subtle/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-event-petrol">{venueName}</p>
                    <p className="mt-1 text-sm text-event-muted">{start} → {end}</p>
                  </div>
                  <span className={cn('w-fit rounded-full px-3 py-1 text-xs font-bold', STATUS_COLORS[booking.status] ?? 'bg-event-surface text-event-muted')}>
                    {STATUS_LABELS[booking.status] ?? booking.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

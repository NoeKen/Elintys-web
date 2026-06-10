'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { venueBookingsService, type VenueBooking } from '@/features/venues/services/venue-bookings.service';
import { cn } from '@/shared/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  refused: 'Refusé',
  cancelled: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber/20 text-amber',
  confirmed: 'bg-teal/20 text-teal',
  refused: 'bg-red-100 text-red-600',
  cancelled: 'bg-surface text-muted',
};

export default function EventLieuxPage() {
  const { id } = useParams<{ id: string }>();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['venue-bookings', id],
    queryFn: () => venueBookingsService.listByEvent(id),
    staleTime: 30_000,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-xl font-bold text-navy">Lieux réservés</h1>
        <Link href="/lieux" className="text-sm text-teal hover:underline">
          Trouver un lieu →
        </Link>
      </div>

      {isLoading && <p className="text-muted">Chargement…</p>}
      {!isLoading && bookings.length === 0 && (
        <p className="text-muted">Aucune réservation de lieu. <Link href="/lieux" className="text-teal hover:underline">Parcourir les lieux disponibles.</Link></p>
      )}

      <div className="space-y-3">
        {bookings.map((booking: VenueBooking) => {
          const venueName = typeof booking.venue === 'object' && booking.venue
            ? (booking.venue as { name?: string }).name ?? 'Salle'
            : 'Salle';
          const start = booking.bookingStart ? new Date(booking.bookingStart).toLocaleDateString('fr-CA') : '—';
          const end = booking.bookingEnd ? new Date(booking.bookingEnd).toLocaleDateString('fr-CA') : '—';
          return (
            <div key={booking._id} className="border border-border rounded-xl p-4 flex justify-between items-center bg-white">
              <div>
                <p className="font-medium text-navy">{venueName}</p>
                <p className="text-sm text-muted">{start} → {end}</p>
                {booking.totalPrice !== undefined && (
                  <p className="text-sm text-muted">{(booking.totalPrice / 100).toFixed(2)} $ CAD</p>
                )}
              </div>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_COLORS[booking.status] ?? 'bg-surface text-muted')}>
                {STATUS_LABELS[booking.status] ?? booking.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

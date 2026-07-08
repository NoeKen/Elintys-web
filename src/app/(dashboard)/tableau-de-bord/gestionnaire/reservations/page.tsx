'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import { useAuthToken } from '@/server/auth/use-auth-token';
import {
  venueProfileService,
  type VenueBooking,
} from '@/features/venues/services/venue-profile.service';

const STATUS_LABELS: Record<VenueBooking['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  refused: 'Refusé',
  cancelled: 'Annulé',
};

interface RespondFormState {
  message: string;
}

function StatusBadge({ status }: { status: VenueBooking['status'] }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-3 py-0.5 text-xs font-medium',
        status === 'pending' && 'bg-amber text-white',
        status === 'confirmed' && 'bg-teal text-white',
        status === 'refused' && 'bg-red-500 text-white',
        status === 'cancelled' && 'border border-border text-muted',
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function BookingCard({ booking, token }: { booking: VenueBooking; token: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RespondFormState>({ message: '' });

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({
      status,
      message,
    }: {
      status: 'confirmed' | 'refused';
      message?: string;
    }) => venueProfileService.respondToBooking(token, booking._id, status, message),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['venue-bookings-mine'] });
      setOpen(false);
    },
  });

  const handleRespond = (status: 'confirmed' | 'refused') => {
    mutate({ status, message: form.message.trim() || undefined });
  };

  const start = new Date(booking.bookingStart).toLocaleDateString('fr-CA');
  const end = new Date(booking.bookingEnd).toLocaleDateString('fr-CA');

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-navy">
            {booking.event.title}
          </p>
          <p className="text-sm text-muted">
            {booking.organizer.firstName} {booking.organizer.lastName}
          </p>
          <p className="text-sm text-muted">
            Du {start} au {end}
          </p>
          {booking.message && (
            <p className="text-sm text-navy italic">&laquo;&nbsp;{booking.message}&nbsp;&raquo;</p>
          )}
          {booking.totalPrice !== undefined && (
            <p className="text-sm font-medium text-amber">
              {new Intl.NumberFormat('fr-CA', {
                style: 'currency',
                currency: booking.currency ?? 'CAD',
              }).format(booking.totalPrice)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={booking.status} />
          {booking.status === 'pending' && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg border border-teal px-3 py-1.5 text-sm font-medium text-teal transition hover:bg-teal hover:text-white"
            >
              Repondre
            </button>
          )}
        </div>
      </div>

      {open && booking.status === 'pending' && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <label
              htmlFor={`msg-${booking._id}`}
              className="mb-1 block text-sm font-medium text-navy"
            >
              Message (optionnel)
            </label>
            <textarea
              id={`msg-${booking._id}`}
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ message: e.target.value })}
              placeholder="Ajouter un message a l'organisateur..."
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          {error instanceof Error && (
            <p className="text-sm text-red-500">{error.message}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRespond('confirmed')}
              className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? 'En cours...' : 'Confirmer'}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRespond('refused')}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:bg-surface"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GestionnaireReservationsPage() {
  const token = useAuthToken();

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['venue-bookings-mine'],
    queryFn: () => venueProfileService.getMyBookings(token),
    enabled: Boolean(token),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy">Reservations recues</h1>
        <p className="mt-1 text-sm text-muted">
          Suivez et repondez aux demandes de reservation pour votre lieu.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted">Chargement des reservations...</p>
      )}

      {isError && (
        <p className="text-sm text-red-500">
          Impossible de charger les reservations. Veuillez reessayer.
        </p>
      )}

      {bookings && bookings.length === 0 && (
        <p className="text-sm text-muted">Aucune reservation pour le moment.</p>
      )}

      {bookings && bookings.length > 0 && (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking._id}>
              <BookingCard booking={booking} token={token} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

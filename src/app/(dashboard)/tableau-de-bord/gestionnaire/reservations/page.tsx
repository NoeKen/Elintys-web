"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/shared/lib/utils";
import {
  venueBookingsService,
  eventTitle,
  organizerName,
  type VenueBooking,
} from "@/features/venues/services/venue-bookings.service";
import { isMissingProfileError } from "@/features/venues/services/venue-profile.service";
import { getUserFacingError } from "@/shared/lib/user-facing-error";
import { FormErrorAlert } from "@/shared/ui/FormErrorAlert";

const STATUS_LABELS: Record<VenueBooking["status"], string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  refused: "Refusé",
  cancelled: "Annulé",
};

const VENUE_BOOKINGS_KEY = ["venue-bookings-mine"] as const;

function StatusBadge({ status }: { status: VenueBooking["status"] }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-0.5 text-xs font-medium",
        status === "pending" && "bg-amber text-white",
        status === "confirmed" && "bg-teal text-white",
        status === "refused" && "bg-red-500 text-white",
        status === "cancelled" && "border border-border text-muted",
      )}
      data-testid="venue-booking-status"
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function BookingCard({ booking }: { booking: VenueBooking }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({
      status,
      responseMessage,
    }: {
      status: "confirmed" | "refused";
      responseMessage?: string;
    }) =>
      // Service canonique : PATCH + responseMessage, aligné sur le contrôleur.
      venueBookingsService.respond(booking._id, { status, responseMessage }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VENUE_BOOKINGS_KEY });
      setOpen(false);
    },
  });

  const handleRespond = (status: "confirmed" | "refused") => {
    mutate({ status, responseMessage: message.trim() || undefined });
  };

  const start = new Date(booking.bookingStart).toLocaleDateString("fr-CA");
  const end = new Date(booking.bookingEnd).toLocaleDateString("fr-CA");

  return (
    <div
      className="rounded-xl border border-border bg-white p-5 shadow-sm"
      data-testid="venue-booking-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-navy">
            {eventTitle(booking.event) ?? "Événement"}
          </p>
          {/* `fullName` : le schéma User n'expose ni firstName ni lastName. */}
          <p className="text-sm text-muted">{organizerName(booking.organizer) ?? "—"}</p>
          <p className="text-sm text-muted">
            Du {start} au {end}
          </p>
          {booking.message && (
            <p className="text-sm italic text-navy">
              &laquo;&nbsp;{booking.message}&nbsp;&raquo;
            </p>
          )}
          {booking.totalPrice !== undefined && (
            <p className="text-sm font-medium text-amber">
              {new Intl.NumberFormat("fr-CA", {
                style: "currency",
                currency: booking.currency ?? "CAD",
              }).format(booking.totalPrice)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={booking.status} />
          {booking.status === "pending" && (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="min-h-11 rounded-lg border border-teal px-3 py-1.5 text-sm font-medium text-teal transition hover:bg-teal hover:text-white"
              aria-expanded={open}
              data-testid="venue-booking-reply"
            >
              Répondre
            </button>
          )}
        </div>
      </div>

      {open && booking.status === "pending" && (
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
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ajouter un message à l’organisateur…"
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          {error && (
            <FormErrorAlert
              error={getUserFacingError(error, {
                fallback:
                  "Impossible d’enregistrer votre réponse à cette réservation. Réessayez.",
              })}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRespond("confirmed")}
              className="min-h-11 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              data-testid="venue-booking-confirm"
            >
              {isPending ? "En cours…" : "Confirmer"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRespond("refused")}
              className="min-h-11 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              data-testid="venue-booking-refuse"
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:bg-surface"
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
  const {
    data: bookings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: VENUE_BOOKINGS_KEY,
    queryFn: () => venueBookingsService.listMine(),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy">Réservations reçues</h1>
        <p className="mt-1 text-sm text-muted">
          Suivez et répondez aux demandes de réservation pour votre lieu.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted" role="status">
          Chargement des réservations…
        </p>
      )}

      {/* Aucune fiche lieu : étape manquante du parcours, pas une panne. */}
      {isError && isMissingProfileError(error) && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-navy">
            Créez d’abord votre fiche lieu pour recevoir des demandes de réservation.
          </p>
          <Link
            href="/tableau-de-bord/gestionnaire/fiche"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-teal underline"
          >
            Créer ma fiche
          </Link>
        </div>
      )}

      {isError && !isMissingProfileError(error) && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4" role="alert">
          <p className="text-sm text-destructive">
            Impossible de charger les réservations pour le moment.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 min-h-11 text-sm font-medium text-teal underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {bookings && bookings.length === 0 && (
        <p className="text-sm text-muted" data-testid="empty-state">
          Aucune réservation pour le moment.
        </p>
      )}

      {bookings && bookings.length > 0 && (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking._id}>
              <BookingCard booking={booking} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

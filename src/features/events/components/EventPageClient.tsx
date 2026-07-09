'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { PurchaseModal } from '@/components/tickets/PurchaseModal';
import { cn } from '@/shared/lib/utils';

interface TicketType {
  _id: string;
  name: string;
  price: number; // in cents
  isFree: boolean;
  quantity: number;
  sold: number;
  description?: string;
}

interface EventLocation {
  type: 'physical' | 'online' | 'hybrid';
  address?: string;
  city?: string;
  onlineUrl?: string;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  startDate: string;
  endDate?: string;
  location?: EventLocation;
  slug?: string;
  status: string;
}

interface Props {
  event: Event;
  ticketTypes: TicketType[];
}

export function EventPageClient({ event, ticketTypes }: Props) {
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const startDate = new Date(event.startDate).toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <main className="public-detail-shell mesh-gradient">
      <div className="container-public">
        <article className="public-detail-hero">
          <div className="public-detail-cover">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                unoptimized
                className="image-cinematic"
                sizes="(max-width: 768px) 100vw, 1200px"
                priority
              />
            ) : (
              <div className="flex min-h-[inherit] items-center justify-center">
                <span className="font-serif text-7xl text-white/70" aria-hidden="true">E</span>
              </div>
            )}
          </div>

          <div className="public-detail-body">
            <div className="mb-6 flex flex-wrap gap-3 text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-white/70 px-3 py-2 shadow-[var(--shadow-soft-line)]">
                <CalendarDays className="h-4 w-4 text-teal" aria-hidden="true" />
                {startDate}
              </span>
              {event.location?.city && (
                <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-white/70 px-3 py-2 shadow-[var(--shadow-soft-line)]">
                  <MapPin className="h-4 w-4 text-teal" aria-hidden="true" />
                  {event.location.address ? `${event.location.address}, ` : ''}{event.location.city}
                </span>
              )}
            </div>

            <h1 className="premium-heading mb-5 max-w-3xl">{event.title}</h1>

            {event.description && (
              <p className="premium-subtitle mb-10 whitespace-pre-wrap">
                {event.description}
              </p>
            )}

            <section className="premium-card p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="section-eyebrow mb-3">Billetterie</p>
                  <h2 className="font-serif text-2xl text-on-surface">Billets disponibles</h2>
                </div>
                <div className="hidden h-11 w-11 items-center justify-center rounded-full bg-teal-pale text-teal sm:flex">
                  <Ticket className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              {ticketTypes.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  Aucun billet disponible pour cet événement.
                </p>
              ) : (
                <div className="space-y-3">
                  {ticketTypes.map((tt) => {
                    const available = tt.quantity - tt.sold;
                    return (
                      <div key={tt._id} className="ticket-card">
                        <div>
                          <p className="font-semibold text-on-surface">{tt.name}</p>
                          {tt.description && (
                            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                              {tt.description}
                            </p>
                          )}
                          <p className={cn('mt-2 text-sm', available === 0 ? 'text-destructive' : 'text-on-surface-variant')}>
                            {available === 0 ? 'Complet' : `${available} disponible${available > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-lg font-bold text-navy">
                            {tt.isFree ? 'Gratuit' : `${(tt.price / 100).toFixed(2)} $`}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(tt)}
                            disabled={available === 0}
                            className={cn(
                              'mt-3 min-h-10 rounded-full px-5 text-sm font-bold transition duration-300',
                              available === 0
                                ? 'cursor-not-allowed border border-outline-variant bg-surface-low text-on-surface-variant'
                                : 'premium-button px-5 py-2',
                            )}
                          >
                            {available === 0 ? 'Complet' : 'Choisir'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </article>
      </div>

      {selectedTicket && (
        <PurchaseModal
          ticketType={selectedTicket}
          eventTitle={event.title}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </main>
  );
}

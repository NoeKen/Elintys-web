'use client';

import { useState } from 'react';
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
    <main className="max-w-3xl mx-auto px-4 py-8">
      {event.coverImage && (
        <img src={event.coverImage} alt={event.title} className="w-full h-64 object-cover rounded-2xl mb-6" />
      )}

      <h1 className="font-serif text-3xl font-bold text-navy mb-2">{event.title}</h1>
      <p className="text-muted mb-1">{startDate}</p>
      {event.location?.city && (
        <p className="text-muted mb-6">
          {event.location.address ? `${event.location.address}, ` : ''}{event.location.city}
        </p>
      )}

      {event.description && (
        <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">{event.description}</p>
      )}

      <h2 className="font-serif text-xl font-semibold mb-4">Billets disponibles</h2>

      {ticketTypes.length === 0 ? (
        <p className="text-muted">Aucun billet disponible pour cet événement.</p>
      ) : (
        <div className="space-y-3">
          {ticketTypes.map((tt) => {
            const available = tt.quantity - tt.sold;
            return (
              <div key={tt._id} className="border border-border rounded-xl p-4 flex justify-between items-center bg-white">
                <div>
                  <p className="font-medium text-navy">{tt.name}</p>
                  {tt.description && <p className="text-sm text-muted">{tt.description}</p>}
                  <p className={cn('text-sm mt-1', available === 0 ? 'text-red-500' : 'text-muted')}>
                    {available === 0 ? 'Complet' : `${available} disponible${available > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-navy">
                    {tt.isFree ? 'Gratuit' : `${(tt.price / 100).toFixed(2)} $`}
                  </p>
                  <button
                    onClick={() => setSelectedTicket(tt)}
                    disabled={available === 0}
                    className={cn(
                      'mt-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      available === 0
                        ? 'bg-surface text-muted cursor-not-allowed'
                        : 'bg-teal text-white hover:bg-teal/90',
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

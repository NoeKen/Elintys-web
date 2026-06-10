'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

interface TicketPurchase {
  _id: string;
  event?: { _id?: string; title?: string; startDate?: string } | string;
  ticketType?: { _id?: string; name?: string } | string;
  status: string;
  price: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  valid: 'Valide',
  used: 'Utilisé',
  refunded: 'Remboursé',
  pending: 'En attente',
};

const STATUS_COLORS: Record<string, string> = {
  valid: 'bg-teal/20 text-teal',
  used: 'bg-surface text-muted',
  refunded: 'bg-amber/20 text-amber',
  pending: 'bg-amber/20 text-amber',
};

export default function BilleteriePage() {
  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get<TicketPurchase[]>('/tickets/my').then(r => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-navy mb-6">Mes billets</h1>

      {isLoading && <p className="text-muted">Chargement…</p>}
      {isError && <p className="text-red-500 text-sm">Impossible de charger vos billets.</p>}
      {!isLoading && !isError && tickets.length === 0 && (
        <p className="text-muted">Aucun billet acheté pour l&apos;instant.</p>
      )}

      <div className="space-y-3">
        {tickets.map((t: TicketPurchase) => {
          const eventTitle = typeof t.event === 'object' && t.event ? (t.event.title ?? '—') : '—';
          const ticketName = typeof t.ticketType === 'object' && t.ticketType ? (t.ticketType.name ?? '—') : '—';
          return (
            <div key={t._id} className="border border-border rounded-xl p-4 flex justify-between items-center bg-white">
              <div>
                <p className="font-medium text-navy">{eventTitle}</p>
                <p className="text-sm text-muted">{ticketName}</p>
                <p className="text-xs text-muted">{new Date(t.createdAt).toLocaleDateString('fr-CA')}</p>
              </div>
              <div className="text-right">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_COLORS[t.status] ?? 'bg-surface text-muted')}>
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

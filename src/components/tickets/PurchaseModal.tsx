'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import api from '@/shared/lib/api';
import { useAuth } from '@/shared/hooks/useAuth';

interface TicketType {
  _id: string;
  name: string;
  price: number;
  isFree: boolean;
  quantity: number;
  sold: number;
}

interface Props {
  ticketType: TicketType;
  eventTitle: string;
  onClose: () => void;
}

export function PurchaseModal({ ticketType, eventTitle, onClose }: Props) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = ticketType.quantity - ticketType.sold;
  const totalCAD = ((ticketType.price * quantity) / 100).toFixed(2);

  const handlePurchase = async () => {
    if (!user && !guestEmail) {
      setError('Veuillez entrer votre courriel pour continuer.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (ticketType.isFree) {
        await api.post('/tickets/purchase', {
          ticketTypeId: ticketType._id,
          quantity,
          guestEmail: user ? undefined : guestEmail || undefined,
          guestName: user ? undefined : guestName || undefined,
        });
        alert(`${quantity} billet${quantity > 1 ? 's' : ''} réservé${quantity > 1 ? 's' : ''} avec succès !`);
        onClose();
      } else {
        const res = await api.post<{ sessionUrl: string }>('/payments/checkout', {
          ticketTypeId: ticketType._id,
          quantity,
          guestEmail: user ? undefined : guestEmail || undefined,
          guestName: user ? undefined : guestName || undefined,
        });
        window.location.href = res.data.sessionUrl;
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 503) {
        setError("Paiement en ligne bientôt disponible. Contactez l'organisateur pour réserver.");
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-navy">{ticketType.name}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-muted hover:text-navy text-xl leading-none">✕</button>
        </div>
        <p className="text-sm text-muted mb-4">{eventTitle}</p>

        {/* Quantity selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-navy mb-2">Quantité</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              aria-label="Réduire la quantité"
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-surface text-navy"
            >−</button>
            <span className="w-8 text-center font-semibold text-navy">{quantity}</span>
            <button
              onClick={() => setQuantity(q => Math.min(available, q + 1))}
              aria-label="Augmenter la quantité"
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-surface text-navy"
            >+</button>
            <span className="text-sm text-muted">({available} disponible{available > 1 ? 's' : ''})</span>
          </div>
        </div>

        {/* Guest fields */}
        {!user && (
          <div className="mb-4 space-y-2">
            <div>
              <label htmlFor="guestEmail" className="block text-sm font-medium text-navy mb-1">
                Courriel <span className="text-red-500">*</span>
              </label>
              <input
                id="guestEmail"
                type="email"
                placeholder="votre@courriel.com"
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-navy mb-1">Prénom et nom</label>
              <input
                id="guestName"
                type="text"
                placeholder="Marie Tremblay"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <div>
            {ticketType.isFree ? (
              <span className="font-semibold text-teal">Gratuit</span>
            ) : (
              <span className="font-semibold text-navy">{totalCAD} $ CAD</span>
            )}
            {!ticketType.isFree && <p className="text-xs text-muted">+ 1,49 $ frais de service</p>}
          </div>
          <button
            onClick={handlePurchase}
            disabled={loading || available === 0}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-colors',
              loading || available === 0
                ? 'bg-surface text-muted cursor-not-allowed'
                : 'bg-teal text-white hover:bg-teal/90',
            )}
          >
            {loading ? 'Chargement…' : ticketType.isFree ? 'Réserver' : 'Payer'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TicketType {
  _id: string;
  name: string;
  description?: string;
  price: number;
  availableQuantity: number;
  totalQuantity: number;
}

interface TicketSelectorProps {
  eventId: string;
  ticketTypes: TicketType[];
}

export function TicketSelector({ eventId, ticketTypes }: TicketSelectorProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((t) => [t._id, 0]))
  );

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min((prev[id] ?? 0) + delta, 10)),
    }));
  };

  const subtotal = ticketTypes.reduce(
    (sum, t) => sum + (quantities[t._id] ?? 0) * t.price,
    0
  );
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + serviceFee;
  const hasSelection = Object.values(quantities).some((q) => q > 0);

  const handlePurchase = () => {
    if (!hasSelection) return;
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => `${id}:${qty}`)
      .join(',');
    router.push(`/checkout/${eventId}?items=${items}`);
  };

  return (
    <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: 'var(--shadow-ambient)' }}>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--on-surface)', marginBottom: 24 }}>
        Billetterie
      </h3>

      {ticketTypes.length === 0 ? (
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
          Aucun billet disponible pour cet événement.
        </p>
      ) : (
        ticketTypes.map((ticket) => {
          const sold = ticket.totalQuantity - ticket.availableQuantity;
          const pct = ticket.totalQuantity > 0 ? Math.round((sold / ticket.totalQuantity) * 100) : 0;
          const isAvailable = ticket.availableQuantity > 0;

          return (
            <div
              key={ticket._id}
              style={{
                background: 'var(--surface-low)',
                borderRadius: 10,
                padding: 16,
                marginBottom: 12,
                opacity: isAvailable ? 1 : 0.50,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--on-surface)' }}>
                    {ticket.name}
                  </div>
                  {ticket.description && (
                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                      {ticket.description}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', flexShrink: 0 }}>
                  {ticket.price === 0 ? 'Gratuit' : `${ticket.price}$`}
                </div>
              </div>

              <div style={{ height: 3, background: 'white', borderRadius: 999, margin: '12px 0 5px' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: pct > 85 ? 'var(--color-amber)' : 'var(--color-teal)',
                    transition: 'width 400ms ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                Places restantes : {ticket.availableQuantity}/{ticket.totalQuantity}
              </div>

              {isAvailable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
                  <button
                    onClick={() => updateQty(ticket._id, -1)}
                    aria-label="Retirer un billet"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 300,
                      color: 'var(--on-surface)',
                    }}
                  >
                    −
                  </button>
                  <span style={{ fontWeight: 600, fontSize: 15, minWidth: 16, textAlign: 'center' }}>
                    {quantities[ticket._id] ?? 0}
                  </span>
                  <button
                    onClick={() => updateQty(ticket._id, 1)}
                    aria-label="Ajouter un billet"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 300,
                      color: 'var(--on-surface)',
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {hasSelection && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--surface-low)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--on-surface)', marginBottom: 8 }}>
            <span>Sous-total</span>
            <span>{subtotal.toFixed(2)}$</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--on-surface-variant)' }}>
            <span>Frais de service (5%)</span>
            <span>{serviceFee.toFixed(2)}$</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginTop: 14 }}>
            <span style={{ color: 'var(--on-surface)' }}>Total</span>
            <span style={{ color: 'var(--color-teal)' }}>{total.toFixed(2)}$</span>
          </div>
        </div>
      )}

      <button
        onClick={handlePurchase}
        disabled={!hasSelection}
        style={{
          width: '100%',
          marginTop: 20,
          padding: '15px',
          background: hasSelection ? 'var(--color-teal)' : 'var(--surface-low)',
          color: hasSelection ? 'white' : 'var(--on-surface-variant)',
          border: 'none',
          borderRadius: 8,
          cursor: hasSelection ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 15,
          boxShadow: hasSelection ? 'inset 0 1px 0 rgba(255,255,255,0.10)' : 'none',
          transition: 'all 200ms',
        }}
      >
        Acheter mes billets →
      </button>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 10 }}>
        🔒 Paiement sécurisé par Stripe
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
        <button style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--on-surface-variant)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          📤 Partager
        </button>
        <button style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--on-surface-variant)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          🤍 Sauvegarder
        </button>
      </div>
    </div>
  );
}

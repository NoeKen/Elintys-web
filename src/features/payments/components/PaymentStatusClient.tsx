'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { participationCopy } from '@/features/events/lib/participation-error';
import {
  fetchTicketOrder,
  isTerminalDisplayState,
  syncTicketOrder,
  toDisplayState,
  type PaymentDisplayState,
  type TicketOrderView,
} from '../lib/ticket-order';

const copy = participationCopy.payment;

/**
 * Bornes de la synchronisation.
 *
 * Le polling est BORNÉ : au-delà, on cesse d'interroger le serveur et on
 * propose une reprise manuelle. Aucun polling infini.
 */
export const MAX_SYNC_ATTEMPTS = 6;
export const SYNC_INTERVAL_MS = 2_500;

interface Props {
  orderId: string | null;
  /** Libellé d'introduction propre à la page (retour réussi ou annulation). */
  introTitle?: string;
  introDescription?: string;
}

const STATE_COPY: Record<PaymentDisplayState, { title: string; description: string }> = {
  checking: { title: copy.checkingTitle, description: copy.checkingDescription },
  paid: { title: copy.paidTitle, description: copy.paidDescription },
  failed: { title: copy.failedTitle, description: copy.failedDescription },
  expired: { title: copy.expiredTitle, description: copy.expiredDescription },
  cancelled: { title: copy.cancelledTitle, description: copy.cancelledDescription },
  pending: { title: copy.pendingTitle, description: copy.pendingDescription },
  review: { title: copy.reviewTitle, description: copy.reviewDescription },
  networkError: { title: copy.networkErrorTitle, description: copy.networkErrorDescription },
  missingOrder: { title: copy.missingOrderTitle, description: copy.missingOrderDescription },
};

/**
 * Affiche l'état RÉEL d'une commande après retour du fournisseur de paiement.
 *
 * PRINCIPE : le retour du navigateur n'est jamais une preuve de paiement.
 * Le composant demande au serveur de synchroniser l'issue auprès du
 * fournisseur, puis affiche l'état que le serveur renvoie — jamais un état
 * déduit de l'URL de retour.
 */
export function PaymentStatusClient({ orderId, introTitle, introDescription }: Props) {
  const [order, setOrder] = useState<TicketOrderView | null>(null);
  const [state, setState] = useState<PaymentDisplayState>(orderId ? 'checking' : 'missingOrder');
  const [exhausted, setExhausted] = useState(false);
  const attempts = useRef(0);
  const cancelled = useRef(false);

  const applyOrder = useCallback((next: TicketOrderView) => {
    setOrder(next);
    const nextState = toDisplayState(next);
    setState(nextState);
    return nextState;
  }, []);

  const runSync = useCallback(async (): Promise<PaymentDisplayState | null> => {
    if (!orderId) return null;
    try {
      // On demande d'abord au serveur de régler auprès du fournisseur, puis
      // on relit. Les deux appels sont idempotents côté serveur.
      const synced = await syncTicketOrder(orderId).catch(() => fetchTicketOrder(orderId));
      return applyOrder(synced);
    } catch {
      setState('networkError');
      return 'networkError';
    }
  }, [orderId, applyOrder]);

  useEffect(() => {
    if (!orderId) return;
    cancelled.current = false;
    attempts.current = 0;

    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled.current) return;
      attempts.current += 1;
      const result = await runSync();
      if (cancelled.current) return;

      if (result && isTerminalDisplayState(result)) return;
      if (attempts.current >= MAX_SYNC_ATTEMPTS) {
        // Borne atteinte : on arrête et on laisse la main à l'utilisateur.
        setExhausted(true);
        setState((current) => (current === 'networkError' ? current : 'pending'));
        return;
      }
      timer = setTimeout(() => void tick(), SYNC_INTERVAL_MS);
    };

    void tick();
    return () => {
      cancelled.current = true;
      clearTimeout(timer);
    };
  }, [orderId, runSync]);

  const handleRetry = () => {
    attempts.current = 0;
    setExhausted(false);
    setState('checking');
    void runSync();
  };

  const { title, description } = STATE_COPY[state];
  const isBusy = state === 'checking';
  const canRetry = exhausted || state === 'networkError' || state === 'pending';

  return (
    <section
      className="glass-card mx-auto max-w-2xl p-7 text-center sm:p-10"
      aria-labelledby="payment-status-title"
    >
      {introTitle && <p className="section-eyebrow">{introTitle}</p>}

      <h1 id="payment-status-title" className="premium-heading mt-3">
        {title}
      </h1>

      {/* L'état évolue sans interaction : il doit être annoncé aux lecteurs d'écran. */}
      <div aria-live="polite" aria-atomic="true" aria-label={copy.statusRegion}>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
          {description}
        </p>
        {isBusy && (
          <p className="mt-2 text-sm text-on-surface-variant" role="status">
            {copy.checkingDescription}
          </p>
        )}
      </div>

      {introDescription && !order && (
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
          {introDescription}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {canRetry && (
          <button type="button" onClick={handleRetry} className="premium-button min-h-11 px-5">
            {copy.retryCta}
          </button>
        )}
        <Link
          href="/tableau-de-bord/participation"
          className="premium-button-secondary min-h-11 px-5"
        >
          {copy.participationCta}
        </Link>
        <Link href="/evenements" className="premium-button-secondary min-h-11 px-5">
          {participationCopy.discoverEvents}
        </Link>
      </div>
    </section>
  );
}

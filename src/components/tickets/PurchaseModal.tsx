'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { CheckCircle2, Minus, Plus } from 'lucide-react';
import { ApiClientError } from '@/shared/lib/api';
import { useAuth } from '@/shared/hooks/useAuth';
import { getLoginPath } from '@/lib/auth/redirects';
import { getParticipationError, participationCopy as copy } from '@/features/events/lib/participation-error';
import { usePurchaseFreeTicket } from '@/features/tickets/hooks/useTickets';
import { createTicketOrder } from '@/features/payments/lib/ticket-order';
import { isTrustedApprovalUrl } from '@/features/payments/lib/paypal-approval';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import { Modal } from '@/shared/ui/Modal';

interface TicketType {
  _id: string;
  name: string;
  price: number;
  isFree: boolean;
  quantity: number;
  sold: number;
  reserved: number;
}

interface Props {
  ticketType: TicketType;
  eventTitle: string;
  eventSlug: string;
  accessGrant?: string;
  onClose: () => void;
}

function shouldRotateKey(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false;
  return error.status >= 400 && error.status < 500 && error.status !== 429;
}

export function PurchaseModal({ ticketType, eventTitle, eventSlug, accessGrant, onClose }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const purchase = usePurchaseFreeTicket(ticketType._id);
  const attemptKey = useRef<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasedCount, setPurchasedCount] = useState<number | null>(null);
  const [paidPending, setPaidPending] = useState(false);
  const [paidError, setPaidError] = useState<unknown>(null);
  const available = Math.max(0, ticketType.quantity - ticketType.sold - ticketType.reserved);
  const returnPath = `/evenements/${eventSlug}#billets`;
  const registerHref = `/inscription/etape-1?redirect=${encodeURIComponent(returnPath)}`;

  /**
   * Achat payant : la commande est créée côté serveur (qui réserve le stock et
   * calcule le prix), puis l'utilisateur est redirigé vers le fournisseur.
   *
   * La clé d'idempotence est STABLE pour une même tentative : un double clic
   * rejoue la même commande au lieu d'en créer une seconde.
   */
  const handlePaidPurchase = async () => {
    if (ticketType.isFree || paidPending || !user) return;
    const idempotencyKey = attemptKey.current ?? crypto.randomUUID();
    attemptKey.current = idempotencyKey;
    setPaidPending(true);
    setPaidError(null);
    try {
      const order = await createTicketOrder({
        lines: [{ ticketTypeId: ticketType._id, quantity }],
        idempotencyKey,
        accessGrant,
      });
      const approvalUrl = order.payment.checkoutUrl;
      if (approvalUrl && isTrustedApprovalUrl(approvalUrl)) {
        window.location.assign(approvalUrl);
        return;
      }
      // Commande créée mais aucune URL exploitable : on ne prétend rien.
      setPaidError(new Error('PAYMENT_PROVIDER_UNAVAILABLE'));
    } catch (error) {
      if (shouldRotateKey(error)) attemptKey.current = null;
      setPaidError(error);
    } finally {
      setPaidPending(false);
    }
  };

  const handlePurchase = async () => {
    if (!ticketType.isFree || purchase.isPending || !user) return;
    const idempotencyKey = attemptKey.current ?? crypto.randomUUID();
    attemptKey.current = idempotencyKey;
    try {
      const tickets = await purchase.mutateAsync({ quantity, accessGrant, idempotencyKey });
      setPurchasedCount(tickets.length);
    } catch (error) {
      if (shouldRotateKey(error)) attemptKey.current = null;
    }
  };

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open && !purchase.isPending && !paidPending) onClose();
      }}
      title={ticketType.isFree ? copy.freeTicketTitle : copy.payment.buyCta}
      description={`${ticketType.name} — ${eventTitle}`}
      className="mx-4 max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto"
    >
      {purchasedCount !== null ? (
        <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5" role="status" aria-live="polite">
          <CheckCircle2 className="h-8 w-8 text-teal" aria-hidden="true" />
          <p className="mt-3 font-bold text-navy">
            {copy.reserveSuccess.replace('{count}', String(purchasedCount))}
          </p>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">{copy.reserveSuccessHint}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/tableau-de-bord/participation" className="premium-button min-h-12 px-5">
              {copy.viewMyParticipation}
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 cursor-pointer rounded-full border border-outline px-5 text-sm font-bold text-navy transition-colors hover:border-teal"
            >
              {copy.close}
            </button>
          </div>
        </div>
      ) : authLoading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-surface-low" aria-busy="true" />
      ) : !user ? (
        <div>
          <p className="text-sm leading-6 text-on-surface-variant">{copy.signInToReserve}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href={getLoginPath(returnPath)} className="premium-button min-h-12 px-5">
              {copy.signInToReserve}
            </Link>
            <Link
              href={registerHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-outline px-5 text-sm font-bold text-navy transition-colors hover:border-teal hover:text-teal"
            >
              {copy.createAccount}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-bold text-navy" htmlFor="free-ticket-quantity">
              {copy.quantityLabel}
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1 || purchase.isPending}
                aria-label={copy.decreaseQuantity}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-outline text-navy transition-colors hover:border-teal disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <output id="free-ticket-quantity" className="min-w-10 text-center text-lg font-bold text-navy" aria-live="polite">
                {quantity}
              </output>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(available, current + 1))}
                disabled={quantity >= available || purchase.isPending}
                aria-label={copy.increaseQuantity}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-outline text-navy transition-colors hover:border-teal disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="text-sm text-on-surface-variant">
                {copy.availableCount.replace('{count}', String(available))}
              </span>
            </div>
          </div>

          {!ticketType.isFree && (
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">
              {copy.payment.holdNotice} {copy.payment.redirectNotice}
            </p>
          )}

          {purchase.isError && (
            <FormErrorAlert error={getParticipationError(purchase.error)} className="mt-4" />
          )}
          {paidError !== null && (
            <FormErrorAlert error={getParticipationError(paidError)} className="mt-4" />
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={purchase.isPending || paidPending}
              className="min-h-12 cursor-pointer rounded-full border border-outline px-5 text-sm font-bold text-navy transition-colors hover:border-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.close}
            </button>
            <button
              type="button"
              onClick={() => void (ticketType.isFree ? handlePurchase() : handlePaidPurchase())}
              disabled={purchase.isPending || paidPending || available === 0}
              className="premium-button min-h-12 cursor-pointer px-5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ticketType.isFree
                ? purchase.isPending
                  ? copy.reservePending
                  : copy.reserveCta
                : paidPending
                  ? copy.payment.buyPending
                  : copy.payment.buyCta}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

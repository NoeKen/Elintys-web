import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CheckoutPage from '../checkout/[eventId]/page';
import PaymentCancelPage from './annule/page';
import PaymentSuccessPage from './succes/page';
import { SYNC_INTERVAL_MS } from '@/features/payments/components/PaymentStatusClient';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const syncTicketOrder = vi.fn();
const fetchTicketOrder = vi.fn();

vi.mock('@/features/payments/lib/ticket-order', async () => {
  const actual = await vi.importActual<typeof import('@/features/payments/lib/ticket-order')>(
    '@/features/payments/lib/ticket-order',
  );
  return {
    ...actual,
    syncTicketOrder: (...args: unknown[]) => syncTicketOrder(...args),
    fetchTicketOrder: (...args: unknown[]) => fetchTicketOrder(...args),
  };
});

const ORDER_ID = '664f1a2b3c4d5e6f7a8b9c0d';

function order(overrides: Record<string, unknown> = {}) {
  return {
    _id: ORDER_ID,
    event: 'event-1',
    status: 'PENDING_PAYMENT',
    currency: 'cad',
    totalAmount: 4995,
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
    payment: { provider: 'paypal', status: 'PENDING', checkoutUrl: null },
    admissionIds: [],
    requiresManualReview: false,
    failureReason: null,
    ...overrides,
  };
}

const params = (search: Record<string, string> = {}) => ({ searchParams: Promise.resolve(search) });

beforeEach(() => {
  vi.clearAllMocks();
  syncTicketOrder.mockResolvedValue(order());
  fetchTicketOrder.mockResolvedValue(order());
});

describe('Checkout autonome — toujours fermé', () => {
  it('présente le checkout comme indisponible', async () => {
    render(await CheckoutPage({ params: Promise.resolve({ eventId: 'event-1' }) }));

    expect(
      screen.getByRole('heading', { name: 'L’achat en ligne n’est pas encore ouvert' }),
    ).toBeInTheDocument();
  });
});

describe('Routes de retour de paiement', () => {
  it.each([
    ['succès', PaymentSuccessPage],
    ['annulation', PaymentCancelPage],
  ])('ne fabrique aucun résultat de paiement sans commande sur la route %s', async (_l, Page) => {
    render(await Page(params()));

    expect(
      screen.getByRole('heading', { name: 'Commande introuvable' }),
    ).toBeInTheDocument();
    expect(syncTicketOrder).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/aucun montant.*débité|paiement confirmé/i),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['succès', PaymentSuccessPage],
    ['annulation', PaymentCancelPage],
  ])('ignore un order_id malformé sur la route %s', async (_l, Page) => {
    render(await Page(params({ order_id: '../admin' })));

    expect(screen.getByRole('heading', { name: 'Commande introuvable' })).toBeInTheDocument();
    expect(syncTicketOrder).not.toHaveBeenCalled();
  });

  it('demande au serveur l’état réel plutôt que de le déduire de l’URL', async () => {
    render(await PaymentSuccessPage(params({ order_id: ORDER_ID })));

    await waitFor(() => expect(syncTicketOrder).toHaveBeenCalledWith(ORDER_ID));
    expect(screen.getByRole('heading', { name: 'Nous confirmons votre paiement…' }))
      .toBeInTheDocument();
  });

  it('affiche la confirmation seulement lorsque le serveur renvoie PAID', async () => {
    syncTicketOrder.mockResolvedValue(order({ status: 'PAID', admissionIds: ['a1'] }));

    render(await PaymentSuccessPage(params({ order_id: ORDER_ID })));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Votre paiement est confirmé' })).toBeInTheDocument(),
    );
  });

  it('n’affirme jamais qu’aucun montant n’a été débité sur la route d’annulation', async () => {
    render(await PaymentCancelPage(params({ order_id: ORDER_ID })));

    await waitFor(() => expect(syncTicketOrder).toHaveBeenCalled());
    expect(screen.queryByText(/aucun montant.*débité/i)).not.toBeInTheDocument();
  });

  it('formule la revue manuelle sans promettre de remboursement', async () => {
    syncTicketOrder.mockResolvedValue(order({ status: 'EXPIRED', requiresManualReview: true }));

    render(await PaymentSuccessPage(params({ order_id: ORDER_ID })));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Vérification en cours' })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Aucun nouveau paiement n'est nécessaire/i)).toBeInTheDocument();
    expect(screen.queryByText(/rembours/i)).not.toBeInTheDocument();
  });

  it('reste factuel lorsque le serveur est injoignable', async () => {
    syncTicketOrder.mockRejectedValue(new Error('network'));
    fetchTicketOrder.mockRejectedValue(new Error('network'));

    render(await PaymentSuccessPage(params({ order_id: ORDER_ID })));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'État indisponible' })).toBeInTheDocument(),
    );
    expect(screen.queryByText(/paiement confirmé/i)).not.toBeInTheDocument();
  });

  it('expose une région live pour annoncer le changement d’état', async () => {
    render(await PaymentSuccessPage(params({ order_id: ORDER_ID })));

    const live = screen.getByLabelText('État de votre commande');
    expect(live).toHaveAttribute('aria-live', 'polite');
  });

  it('redémarre un cycle de polling borné après une reprise manuelle', async () => {
    vi.useFakeTimers();
    try {
      syncTicketOrder
        .mockResolvedValueOnce(order())
        .mockResolvedValueOnce(order())
        .mockResolvedValueOnce(order())
        .mockResolvedValueOnce(order())
        .mockResolvedValueOnce(order())
        .mockResolvedValueOnce(order())
        .mockResolvedValueOnce(order())
        .mockResolvedValueOnce(order({ status: 'PAID', admissionIds: ['a1'] }));

      render(await PaymentSuccessPage(params({ order_id: ORDER_ID })));
      await act(async () => Promise.resolve());

      for (let attempt = 1; attempt < 6; attempt += 1) {
        await act(async () => {
          vi.advanceTimersByTime(SYNC_INTERVAL_MS);
          await Promise.resolve();
        });
      }

      expect(screen.getByRole('button', { name: 'Vérifier à nouveau' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Vérifier à nouveau' }));
      await act(async () => Promise.resolve());
      expect(syncTicketOrder).toHaveBeenCalledTimes(7);

      await act(async () => {
        vi.advanceTimersByTime(SYNC_INTERVAL_MS);
        await Promise.resolve();
      });

      expect(screen.getByRole('heading', { name: 'Votre paiement est confirmé' }))
        .toBeInTheDocument();
      expect(syncTicketOrder).toHaveBeenCalledTimes(8);
    } finally {
      vi.useRealTimers();
    }
  });
});

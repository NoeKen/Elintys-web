import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseModal } from './PurchaseModal';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  mutateAsync: vi.fn(),
  purchaseState: {
    isPending: false,
    isError: false,
    error: null as unknown,
  },
}));

vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => mocks.useAuth() }));
vi.mock('@/features/tickets/hooks/useTickets', () => ({
  usePurchaseFreeTicket: () => ({
    ...mocks.purchaseState,
    mutateAsync: mocks.mutateAsync,
  }),
}));
vi.mock('@/shared/ui/Modal', () => ({
  Modal: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section role="dialog" aria-label={title}>{children}</section>
  ),
}));

const freeTicket = {
  _id: 'ticket-1',
  name: 'Admission générale',
  price: 0,
  isFree: true,
  quantity: 10,
  sold: 0,
};

describe('PurchaseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ user: { id: 'user-1' }, isLoading: false });
    mocks.purchaseState.isPending = false;
    mocks.purchaseState.isError = false;
    mocks.purchaseState.error = null;
    mocks.mutateAsync.mockResolvedValue([{ _id: 'purchase-1' }]);
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
  });

  it('réutilise la même clé idempotente lors de deux soumissions concurrentes', async () => {
    const user = userEvent.setup();
    render(
      <PurchaseModal
        ticketType={freeTicket}
        eventTitle="Gala Elintys"
        eventSlug="gala-elintys"
        accessGrant="signed-grant"
        onClose={vi.fn()}
      />,
    );

    await user.dblClick(screen.getByRole('button', { name: 'Réserver' }));

    expect(mocks.mutateAsync).toHaveBeenCalled();
    for (const [variables] of mocks.mutateAsync.mock.calls) {
      expect(variables).toEqual({
        quantity: 1,
        accessGrant: 'signed-grant',
        idempotencyKey: '00000000-0000-4000-8000-000000000001',
      });
    }
  });

  it('n’expose aucun checkout pour un billet payant', () => {
    render(
      <PurchaseModal
        ticketType={{ ...freeTicket, isFree: false, price: 4500 }}
        eventTitle="Gala Elintys"
        eventSlug="gala-elintys"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Bientôt disponible')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /payer/i })).not.toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('demande une session sans collecter de courriel invité', () => {
    mocks.useAuth.mockReturnValue({ user: null, isLoading: false });
    render(
      <PurchaseModal
        ticketType={freeTicket}
        eventTitle="Gala Elintys"
        eventSlug="gala-elintys"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('link', { name: 'Se connecter pour réserver' })).toHaveAttribute(
      'href',
      '/connexion?redirect=%2Fevenements%2Fgala-elintys%23billets',
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

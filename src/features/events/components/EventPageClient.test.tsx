import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventPageClient } from './EventPageClient';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/shared/lib/api', () => ({ default: { post: mocks.post } }));
vi.mock('@/components/tickets/PurchaseModal', () => ({
  PurchaseModal: () => <div role="dialog">Achat</div>,
}));

const baseEvent = {
  _id: 'event-1',
  title: 'Gala Elintys',
  startDate: '2027-05-12T18:00:00.000Z',
  status: 'published',
  discoverability: 'public' as const,
  accessPolicy: { type: 'open' as const },
  admissionModes: ['paid_ticket' as const],
};

const tickets = [{
  _id: 'ticket-1',
  name: 'Admission générale',
  price: 4500,
  isFree: false,
  quantity: 100,
  sold: 10,
}];

describe('EventPageClient access policies', () => {
  beforeEach(() => vi.clearAllMocks());

  it('laisse un événement public ouvert acheter un billet', () => {
    render(<EventPageClient event={baseEvent} ticketTypes={tickets} />);
    expect(screen.getByRole('button', { name: 'Choisir' })).toBeEnabled();
  });

  it('bloque l’achat avant validation du code puis transmet le grant', async () => {
    const user = userEvent.setup({ delay: null });
    mocks.post.mockResolvedValue({ data: { authorized: true, accessGrant: 'signed-grant' } });
    render(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'access_code', hasAccessCode: true } }}
        ticketTypes={tickets}
      />,
    );

    expect(screen.getByRole('button', { name: 'Choisir' })).toBeDisabled();
    await user.type(screen.getByLabelText('Code d’accès'), 'secret-123');
    await user.click(screen.getByRole('button', { name: 'Entrer un code' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Choisir' })).toBeEnabled());
    expect(mocks.post).toHaveBeenCalledWith('/events/event-1/access/code/verify', { code: 'secret-123' });
  });

  it('ne déverrouille pas les billets lorsqu’un domaine est refusé', async () => {
    const user = userEvent.setup({ delay: null });
    mocks.post.mockResolvedValue({ data: { authorized: false, reason: 'EMAIL_DOMAIN_NOT_ALLOWED' } });
    render(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'email_domain' } }}
        ticketTypes={tickets}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Vérifier mon adresse' }));
    expect(await screen.findByText(/ne correspond pas à un domaine autorisé/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choisir' })).toBeDisabled();
  });

  it('expose une demande d’approbation et une invitation avec des CTA distincts', async () => {
    const user = userEvent.setup({ delay: null });
    mocks.post.mockResolvedValue({ data: {} });
    const { rerender } = render(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'manual_approval' } }}
        ticketTypes={[]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Demander l’accès' }));
    expect(mocks.post).toHaveBeenCalledWith('/events/event-1/access/request', {});

    rerender(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'invitation_token' }, admissionModes: ['invitation'] }}
        ticketTypes={[]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Utiliser mon invitation' })).toHaveAttribute('href', '/invitation');
  });
});

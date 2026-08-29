import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/shared/lib/api';
import { EventPageClient } from './EventPageClient';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  useAuth: vi.fn().mockReturnValue({ user: null, isLoading: false }),
}));

vi.mock('@/shared/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/api')>();
  return { ...actual, default: { post: mocks.post, get: mocks.get } };
});
vi.mock('@/components/tickets/PurchaseModal', () => ({
  PurchaseModal: () => <div role="dialog">Achat</div>,
}));
vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => mocks.useAuth() }));

function renderClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const tickets = [{
  _id: 'ticket-1',
  name: 'Admission générale',
  price: 0,
  isFree: true,
  quantity: 100,
  sold: 10,
}];

const baseEvent = {
  _id: 'event-1',
  slug: 'gala-elintys',
  title: 'Gala Elintys',
  startDate: '2027-05-12T18:00:00.000Z',
  gallery: [],
  timezone: 'America/Toronto',
  dateIsTentative: false,
  discoverability: 'public' as const,
  accessPolicy: { type: 'open' as const },
  admissionModes: ['free_ticket' as const],
  providers: [],
  ticketTypes: tickets,
  relatedEvents: [],
};

describe('EventPageClient access policies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ user: null, isLoading: false });
  });
  afterEach(() => mocks.useAuth.mockReturnValue({ user: null, isLoading: false }));

  it('laisse un événement public ouvert réserver un billet gratuit', () => {
    renderClient(<EventPageClient event={baseEvent} />);
    expect(screen.getByRole('button', { name: 'Choisir' })).toBeEnabled();
  });

  it('présente honnêtement les billets payants comme indisponibles', () => {
    renderClient(
      <EventPageClient
        event={{
          ...baseEvent,
          admissionModes: ['paid_ticket'],
          ticketTypes: [{ ...tickets[0], isFree: false, price: 4500 }],
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Bientôt disponible' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Choisir' })).not.toBeInTheDocument();
  });

  it('bloque l’achat avant validation du code puis transmet le grant', async () => {
    const user = userEvent.setup({ delay: null });
    mocks.post.mockResolvedValue({ data: { authorized: true, accessGrant: 'signed-grant' } });
    renderClient(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'access_code', hasAccessCode: true } }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Choisir' })).toBeDisabled();
    await user.type(screen.getByLabelText('Code d’accès'), 'secret-123');
    await user.click(screen.getByRole('button', { name: 'Entrer un code' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Choisir' })).toBeEnabled());
    expect(mocks.post).toHaveBeenCalledWith('/events/event-1/access/code/verify', { code: 'secret-123' });
  });

  it('explique un code invalide sans afficher le message générique 403', async () => {
    const user = userEvent.setup({ delay: null });
    mocks.post.mockRejectedValue(new ApiClientError(403, { message: 'ACCESS_CODE_INVALID' }));
    renderClient(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'access_code', hasAccessCode: true } }}
      />,
    );

    await user.type(screen.getByLabelText('Code d’accès'), 'mauvais-code');
    await user.click(screen.getByRole('button', { name: 'Entrer un code' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Ce code d’accès est invalide.');
  });

  it('ne déverrouille pas les billets lorsqu’un domaine est refusé', async () => {
    const user = userEvent.setup({ delay: null });
    mocks.useAuth.mockReturnValue({ user: { sub: 'user-1', email: 'u@test.com' }, isLoading: false });
    mocks.post.mockResolvedValue({ data: { authorized: false, reason: 'EMAIL_DOMAIN_NOT_ALLOWED' } });
    renderClient(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'email_domain' } }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Vérifier mon adresse' }));
    expect(await screen.findByText(/ne correspond pas à un domaine autorisé/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choisir' })).toBeDisabled();
  });

  it('expose une demande d’approbation et une invitation avec des CTA distincts', async () => {
    const user = userEvent.setup({ delay: null });
    mocks.useAuth.mockReturnValue({ user: { sub: 'user-1', email: 'u@test.com' }, isLoading: false });
    mocks.post.mockResolvedValue({ data: { status: 'pending' } });
    mocks.get.mockResolvedValue({ data: { status: 'none' } });
    const { unmount } = renderClient(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'manual_approval' }, ticketTypes: [] }}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Demander l’accès' }));
    expect(mocks.post).toHaveBeenCalledWith('/events/event-1/access/request', {});
    expect(await screen.findByText(/en attente d/)).toBeInTheDocument();

    unmount();
    renderClient(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'invitation_token' }, admissionModes: ['invitation'], ticketTypes: [] }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Utiliser mon invitation' })).toHaveAttribute('href', '/invitation');
  });

  it('ne rend aucune billetterie quand le mode d’admission ne l’active pas', () => {
    renderClient(
      <EventPageClient
        event={{ ...baseEvent, admissionModes: ['free'], ticketTypes: [] }}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'Billets disponibles' })).not.toBeInTheDocument();
    expect(screen.getByText(/accessible sans condition supplémentaire/)).toBeInTheDocument();
  });

  it('préserve un retour interne pour la connexion et la création de compte', () => {
    renderClient(
      <EventPageClient
        event={{ ...baseEvent, accessPolicy: { type: 'email_domain', allowedDomains: ['elintys.ca'] } }}
      />,
    );

    expect(screen.getByText(/@elintys.ca/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Se connecter pour continuer' })).toHaveAttribute(
      'href',
      '/connexion?redirect=%2Fevenements%2Fgala-elintys',
    );
    expect(screen.getByRole('link', { name: 'Créer un compte' })).toHaveAttribute(
      'href',
      '/inscription/etape-1?redirect=%2Fevenements%2Fgala-elintys',
    );
  });
});

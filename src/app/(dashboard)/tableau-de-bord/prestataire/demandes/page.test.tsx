import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ApiClientError } from '@/shared/lib/api';
import PrestataireDemandesPage from './page';

const mocks = vi.hoisted(() => ({ listMine: vi.fn(), respond: vi.fn() }));

vi.mock('@/features/vendors/services/vendor-requests.service', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/vendors/services/vendor-requests.service')
  >('@/features/vendors/services/vendor-requests.service');
  return {
    ...actual,
    vendorRequestsService: { listMine: mocks.listMine, respond: mocks.respond },
  };
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<PrestataireDemandesPage />, { wrapper: Wrapper });
}

const pendingRequest = {
  _id: 'req-1',
  event: { _id: 'e1', title: 'Gala annuel' },
  organizer: { _id: 'u1', fullName: 'Camille Tremblay' },
  source: 'platform' as const,
  status: 'pending' as const,
  message: 'Disponible le 12 ?',
  createdAt: '2026-09-01T00:00:00.000Z',
};

describe('Page demandes prestataire', () => {
  beforeEach(() => vi.clearAllMocks());

  it("affiche l'événement et le nom complet de l'organisateur", async () => {
    mocks.listMine.mockResolvedValue([pendingRequest]);

    renderPage();

    expect(await screen.findByText('Gala annuel')).toBeInTheDocument();
    // Régression F-13 : le schéma User porte `fullName`, la page lisait
    // firstName/lastName et affichait un nom vide.
    expect(screen.getByText('Camille Tremblay')).toBeInTheDocument();
  });

  it('accepte via le service canonique (PATCH + responseMessage)', async () => {
    mocks.listMine.mockResolvedValue([pendingRequest]);
    mocks.respond.mockResolvedValue({ ...pendingRequest, status: 'accepted' });

    renderPage();
    await userEvent.click(await screen.findByTestId('vendor-request-reply'));
    await userEvent.type(screen.getByLabelText(/Message/), 'Avec plaisir');
    await userEvent.click(screen.getByTestId('vendor-request-accept'));

    await waitFor(() =>
      expect(mocks.respond).toHaveBeenCalledWith('req-1', {
        status: 'accepted',
        responseMessage: 'Avec plaisir',
      }),
    );
  });

  it('refuse une demande', async () => {
    mocks.listMine.mockResolvedValue([pendingRequest]);
    mocks.respond.mockResolvedValue({ ...pendingRequest, status: 'declined' });

    renderPage();
    await userEvent.click(await screen.findByTestId('vendor-request-reply'));
    await userEvent.click(screen.getByTestId('vendor-request-decline'));

    await waitFor(() =>
      expect(mocks.respond).toHaveBeenCalledWith('req-1', {
        status: 'declined',
        responseMessage: undefined,
      }),
    );
  });

  it("rend visible l'échec d'une réponse", async () => {
    mocks.listMine.mockResolvedValue([pendingRequest]);
    mocks.respond.mockRejectedValue(new ApiClientError(409, { message: 'INVALID_STATUS_TRANSITION' }));

    renderPage();
    await userEvent.click(await screen.findByTestId('vendor-request-reply'));
    await userEvent.click(screen.getByTestId('vendor-request-accept'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('oriente vers la création de profil quand le compte n’en a pas', async () => {
    mocks.listMine.mockRejectedValue(new ApiClientError(404, { message: 'VENDOR_PROFILE_NOT_FOUND' }));

    renderPage();

    expect(
      await screen.findByRole('link', { name: 'Créer mon profil' }),
    ).toHaveAttribute('href', '/tableau-de-bord/prestataire/profil');
  });

  it('distingue un état vide d’une panne de chargement', async () => {
    mocks.listMine.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("n'offre pas de bouton Répondre sur une demande déjà tranchée", async () => {
    mocks.listMine.mockResolvedValue([{ ...pendingRequest, status: 'accepted' as const }]);

    renderPage();
    await screen.findByTestId('vendor-request-card');

    expect(screen.queryByTestId('vendor-request-reply')).not.toBeInTheDocument();
    expect(screen.getByTestId('vendor-request-status')).toHaveTextContent('Accepté');
  });
});

describe('références supprimées', () => {
  beforeEach(() => vi.clearAllMocks());

  it("n'explose pas quand l'événement ou l'organisateur a été supprimé", async () => {
    // `typeof null === 'object'` : sans test de nullité explicite, une
    // référence supprimée faisait planter tout l'écran au lieu d'afficher
    // un repli. Le cas se produit dès qu'un événement est supprimé après
    // l'envoi d'une demande.
    mocks.listMine.mockResolvedValue([
      { ...pendingRequest, event: null, organizer: null },
    ]);

    renderPage();

    expect(await screen.findByTestId('vendor-request-card')).toBeInTheDocument();
    expect(screen.getByText('Événement')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ApiClientError } from '@/shared/lib/api';
import GestionnaireReservationsPage from './page';

const mocks = vi.hoisted(() => ({ listMine: vi.fn(), respond: vi.fn() }));

vi.mock('@/features/venues/services/venue-bookings.service', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/venues/services/venue-bookings.service')
  >('@/features/venues/services/venue-bookings.service');
  return {
    ...actual,
    venueBookingsService: { listMine: mocks.listMine, respond: mocks.respond },
  };
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<GestionnaireReservationsPage />, { wrapper: Wrapper });
}

const pendingBooking = {
  _id: 'bk-1',
  event: { _id: 'e1', title: 'Congrès annuel' },
  organizer: { _id: 'u1', fullName: 'Camille Tremblay' },
  bookingStart: '2026-12-01T00:00:00.000Z',
  bookingEnd: '2026-12-02T00:00:00.000Z',
  status: 'pending' as const,
  createdAt: '2026-09-01T00:00:00.000Z',
};

describe('Page réservations gestionnaire', () => {
  beforeEach(() => vi.clearAllMocks());

  it("affiche l'événement et le nom complet de l'organisateur", async () => {
    mocks.listMine.mockResolvedValue([pendingBooking]);

    renderPage();

    expect(await screen.findByText('Congrès annuel')).toBeInTheDocument();
    expect(screen.getByText('Camille Tremblay')).toBeInTheDocument();
  });

  it('confirme via le service canonique (PATCH + responseMessage)', async () => {
    mocks.listMine.mockResolvedValue([pendingBooking]);
    mocks.respond.mockResolvedValue({ ...pendingBooking, status: 'confirmed' });

    renderPage();
    await userEvent.click(await screen.findByTestId('venue-booking-reply'));
    await userEvent.type(screen.getByLabelText(/Message/), 'Salle disponible');
    await userEvent.click(screen.getByTestId('venue-booking-confirm'));

    await waitFor(() =>
      expect(mocks.respond).toHaveBeenCalledWith('bk-1', {
        status: 'confirmed',
        responseMessage: 'Salle disponible',
      }),
    );
  });

  it('refuse une réservation', async () => {
    mocks.listMine.mockResolvedValue([pendingBooking]);
    mocks.respond.mockResolvedValue({ ...pendingBooking, status: 'refused' });

    renderPage();
    await userEvent.click(await screen.findByTestId('venue-booking-reply'));
    await userEvent.click(screen.getByTestId('venue-booking-refuse'));

    await waitFor(() =>
      expect(mocks.respond).toHaveBeenCalledWith('bk-1', {
        status: 'refused',
        responseMessage: undefined,
      }),
    );
  });

  it("rend visible un conflit de transition concurrente", async () => {
    // Le perdant d'une course reçoit 409 : il doit le voir, pas croire à un succès.
    mocks.listMine.mockResolvedValue([pendingBooking]);
    mocks.respond.mockRejectedValue(new ApiClientError(409, { message: 'INVALID_STATUS_TRANSITION' }));

    renderPage();
    await userEvent.click(await screen.findByTestId('venue-booking-reply'));
    await userEvent.click(screen.getByTestId('venue-booking-confirm'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('oriente vers la création de fiche quand le compte n’en a pas', async () => {
    mocks.listMine.mockRejectedValue(new ApiClientError(404, { message: 'VENUE_PROFILE_NOT_FOUND' }));

    renderPage();

    expect(await screen.findByRole('link', { name: 'Créer ma fiche' })).toHaveAttribute(
      'href',
      '/tableau-de-bord/gestionnaire/fiche',
    );
  });

  it('distingue un état vide d’une panne de chargement', async () => {
    mocks.listMine.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('références supprimées', () => {
  beforeEach(() => vi.clearAllMocks());

  it("n'explose pas quand l'événement ou l'organisateur a été supprimé", async () => {
    mocks.listMine.mockResolvedValue([
      { ...pendingBooking, event: null, organizer: null },
    ]);

    renderPage();

    expect(await screen.findByTestId('venue-booking-card')).toBeInTheDocument();
    expect(screen.getByText('Événement')).toBeInTheDocument();
  });
});

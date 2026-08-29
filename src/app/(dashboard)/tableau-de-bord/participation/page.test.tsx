import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import ParticipationPage from './page';

vi.mock('@/shared/lib/api', () => ({
  default: { get: vi.fn() },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ParticipationPage />
    </QueryClientProvider>,
  );
}

describe('ParticipationPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('réunit inscriptions, invitations et billets dans un espace unique', async () => {
    vi.mocked(api.get).mockImplementation(async (path) => {
      if (path === '/event-registrations/me') {
        return {
          status: 200,
          data: {
            data: [{
              _id: 'registration-1',
              eventId: { _id: 'event-1', title: 'Gala Elintys', slug: 'gala-elintys' },
              status: 'active',
              createdAt: '2027-01-01T00:00:00.000Z',
              updatedAt: '2027-01-01T00:00:00.000Z',
            }],
            total: 1,
            page: 1,
            limit: 100,
          },
        };
      }
      if (path === '/invitations/received') {
        return {
          status: 200,
          data: {
            data: [{
              _id: 'invitation-1',
              name: 'Invitation Gala',
              status: 'pending',
              expiresAt: '2027-02-01T00:00:00.000Z',
              event: { title: 'Soirée Elintys', slug: 'soiree-elintys' },
              tokenHash: 'must-never-render',
            }],
            total: 1,
            page: 1,
            limit: 25,
          },
        };
      }
      return {
        status: 200,
        data: [{
          _id: 'ticket-1',
          event: { title: 'Festival Elintys', slug: 'festival-elintys' },
          ticketType: { name: 'Admission gratuite', isFree: true },
          status: 'valid',
          price: 0,
          createdAt: '2027-01-01T00:00:00.000Z',
        }],
      };
    });

    renderPage();

    expect(await screen.findByText('Gala Elintys')).toBeInTheDocument();
    expect(screen.getByText('Soirée Elintys')).toBeInTheDocument();
    expect(screen.getByText('Festival Elintys')).toBeInTheDocument();
    expect(screen.queryByText('must-never-render')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ma participation' })).toBeInTheDocument();
  });

  it('affiche trois états vides honnêtes sans inventer de données', async () => {
    vi.mocked(api.get).mockImplementation(async (path) => ({
      status: 200,
      data: path === '/tickets/my'
        ? []
        : { data: [], total: 0, page: 1, limit: path === '/event-registrations/me' ? 100 : 25 },
    }));

    renderPage();

    expect(await screen.findByText('Aucune inscription active')).toBeInTheDocument();
    expect(screen.getByText('Aucune invitation reçue')).toBeInTheDocument();
    expect(screen.getByText('Aucun billet pour l’instant')).toBeInTheDocument();
  });
});

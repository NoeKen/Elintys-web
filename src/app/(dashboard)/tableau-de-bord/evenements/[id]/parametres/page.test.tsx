import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventSettingsPage from './page';
import { eventsService } from '@/features/events/services/events.service';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '507f1f77bcf86cd799439011' }),
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/features/events/services/events.service', () => ({
  eventsService: {
    get: vi.fn(),
    cancel: vi.fn(),
    delete: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
  },
}));

const baseEvent = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Gala Boréal',
  status: 'draft' as const,
  discoverability: 'public' as const,
  accessPolicy: { type: 'open' as const },
  admissionModes: ['registration_only' as const],
  location: { type: 'physical' as const },
  capacity: 100,
  createdAt: '2026-09-01T12:00:00.000Z',
  updatedAt: '2026-09-01T12:00:00.000Z',
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <EventSettingsPage />
    </QueryClientProvider>,
  );
}

describe('Event settings lifecycle actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('réserve la suppression définitive au brouillon', async () => {
    vi.mocked(eventsService.get).mockResolvedValue(baseEvent);
    renderPage();

    expect(
      await screen.findByRole('button', { name: /Supprimer définitivement/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Annuler l/i })).not.toBeInTheDocument();
  });

  it.each(['published', 'ongoing'] as const)(
    'propose une confirmation d’annulation pour %s sans suppression',
    async (status) => {
      vi.mocked(eventsService.get).mockResolvedValue({ ...baseEvent, status });
      const user = userEvent.setup();
      renderPage();

      await user.click(await screen.findByRole('button', { name: /Annuler l/i }));
      expect(screen.getByRole('dialog')).toHaveTextContent('Aucun remboursement');
      expect(
        screen.queryByRole('button', { name: /Supprimer définitivement/i }),
      ).not.toBeInTheDocument();
    },
  );

  it.each(['completed', 'cancelled'] as const)(
    'rend l’état terminal %s consultable sans action destructive',
    async (status) => {
      vi.mocked(eventsService.get).mockResolvedValue({ ...baseEvent, status });
      renderPage();

      expect(await screen.findByText(/état terminal/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Annuler l/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Supprimer définitivement/i }),
      ).not.toBeInTheDocument();
    },
  );
});

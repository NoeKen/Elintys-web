import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizerEventsExperience } from './OrganizerEventsExperience';
import { eventsService } from '@/features/events/services/events.service';
import type { Event } from '@/features/events/types';

vi.mock('next/image', () => ({ default: () => <span data-testid="optimized-image" /> }));
vi.mock('@/features/events/services/events.service', () => ({ eventsService: { getMyEvents: vi.fn() } }));

const event: Event = {
  _id: 'event-1', title: 'Gala Boréal', eventType: 'gala', status: 'draft',
  location: { type: 'physical', city: 'Montréal' }, capacity: 120,
  creationProgress: { currentStep: 3, completedSteps: [1, 2], skippedSteps: [], lastSavedAt: '2026-08-02T10:00:00Z' },
  createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-02T10:00:00Z',
};

function renderExperience() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><OrganizerEventsExperience /></QueryClientProvider>);
}

describe('OrganizerEventsExperience', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche les événements réels et permet la recherche', async () => {
    vi.mocked(eventsService.getMyEvents).mockResolvedValue({ data: [event], meta: { total: 1, page: 1, perPage: 100, lastPage: 1 } });
    renderExperience();
    expect(await screen.findByText('Gala Boréal')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Rechercher un événement…'), { target: { value: 'introuvable' } });
    expect(await screen.findByText('Aucun événement ne correspond à cette vue')).toBeInTheDocument();
  });

  it('affiche un état vide actionnable', async () => {
    vi.mocked(eventsService.getMyEvents).mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 100, lastPage: 1 } });
    renderExperience();
    expect(await screen.findByText('Aucun événement ne correspond à cette vue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Effacer les filtres' })).toBeInTheDocument();
  });
});

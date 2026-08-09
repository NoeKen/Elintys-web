import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizerDashboardExperience } from './OrganizerDashboardExperience';
import {
  eventsService,
  type OrganizerDashboardSummary,
  type OrganizerEvent,
} from '@/features/events/services/events.service';

vi.mock('next/image', () => ({ default: () => <span data-testid="optimized-image" /> }));
vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => ({ user: { firstName: 'Noé' } }) }));
vi.mock('@/features/events/services/events.service', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/events/services/events.service')>();
  return { ...original, eventsService: { getOrganizerSummary: vi.fn() } };
});

const event: OrganizerEvent = {
  _id: 'event-1', title: 'Gala Boréal', eventType: 'gala', status: 'draft',
  startDate: '2026-08-20T18:00:00Z', location: { type: 'physical', city: 'Montréal' },
  discoverability: 'public', accessPolicy: { type: 'open' }, admissionModes: ['registration_only'],
  creationProgress: { currentStep: 3, completedSteps: [1, 2], skippedSteps: [], lastSavedAt: '2026-08-02T10:00:00Z' },
  readiness: { publishable: false, errors: [{ code: 'PHYSICAL_LOCATION_REQUIRED', field: 'location' }], warnings: [] },
  pendingAccessRequests: 0, createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-02T10:00:00Z',
};

const summary: OrganizerDashboardSummary = {
  metrics: { totalEvents: 1, activeEvents: 1, upcomingEvents: 1, draftEvents: 1, pendingActions: 1 },
  actions: [{ code: 'ADD_VENUE', priority: 'medium', event, progress: 33 }],
  upcoming: [event],
  activityAvailable: false,
};

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><OrganizerDashboardExperience /></QueryClientProvider>);
}

describe('OrganizerDashboardExperience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventsService.getOrganizerSummary).mockResolvedValue(summary);
  });

  it('affiche le prénom réel, les KPI, l’action et le prochain événement', async () => {
    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Bonjour Noé' })).toBeInTheDocument();
    expect(screen.getByText('Événements actifs')).toBeInTheDocument();
    expect(screen.getByText('Dans les 30 prochains jours')).toBeInTheDocument();
    expect(screen.getByText('Ajouter le lieu')).toBeInTheDocument();
    expect(screen.getAllByText('Gala Boréal').length).toBeGreaterThan(0);
    expect(screen.getByText('L’activité récente de vos événements apparaîtra ici.')).toBeInTheDocument();
  });

  it('affiche un état nouveau compte actionnable', async () => {
    vi.mocked(eventsService.getOrganizerSummary).mockResolvedValue({
      metrics: { totalEvents: 0, activeEvents: 0, upcomingEvents: 0, draftEvents: 0, pendingActions: 0 },
      actions: [], upcoming: [], activityAvailable: false,
    });
    renderDashboard();

    expect(await screen.findByText('Commencez votre narration événementielle')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Créer votre premier événement' })).toHaveAttribute('href', '/evenements/creer');
  });

  it('affiche une erreur et permet le retry', async () => {
    vi.mocked(eventsService.getOrganizerSummary)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(summary);
    const user = userEvent.setup();
    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Votre activité est momentanément inaccessible' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Bonjour Noé' })).toBeInTheDocument());
  });
});

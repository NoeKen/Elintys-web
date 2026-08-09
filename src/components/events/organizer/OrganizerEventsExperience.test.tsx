import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizerEventsExperience } from './OrganizerEventsExperience';
import {
  eventsService,
  type OrganizerEvent,
  type OrganizerEventsPage,
} from '@/features/events/services/events.service';

vi.mock('next/image', () => ({ default: () => <span data-testid="optimized-image" /> }));
vi.mock('@/features/events/services/events.service', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/events/services/events.service')>();
  return {
    ...original,
    eventsService: {
      getMyEvents: vi.fn(),
      publish: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const event: OrganizerEvent = {
  _id: 'event-1', title: 'Gala Boréal', eventType: 'gala', status: 'draft',
  location: { type: 'physical', city: 'Montréal' }, capacity: 120,
  discoverability: 'public', accessPolicy: { type: 'open' }, admissionModes: ['registration_only'],
  creationProgress: { currentStep: 3, completedSteps: [1, 2], skippedSteps: [], lastSavedAt: '2026-08-02T10:00:00Z' },
  readiness: { publishable: true, errors: [], warnings: [] }, pendingAccessRequests: 0,
  createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-02T10:00:00Z',
};

function page(data: OrganizerEvent[], total = data.length, currentPage = 1): OrganizerEventsPage {
  return {
    data,
    total,
    page: currentPage,
    limit: 12,
    meta: { total, page: currentPage, perPage: 12, lastPage: Math.max(1, Math.ceil(total / 12)) },
  };
}

function renderExperience() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><OrganizerEventsExperience /></QueryClientProvider>);
}

describe('OrganizerEventsExperience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventsService.getMyEvents).mockResolvedValue(page([event]));
    vi.mocked(eventsService.publish).mockResolvedValue({ ...event, status: 'published' });
  });

  it('affiche les données paginées et recherche côté serveur', async () => {
    vi.mocked(eventsService.getMyEvents).mockImplementation(async (params) => (
      params?.search ? page([]) : page([event])
    ));
    const user = userEvent.setup();
    renderExperience();

    expect(await screen.findByText('Gala Boréal')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Rechercher un événement…'), 'introuvable');

    await waitFor(() => expect(eventsService.getMyEvents).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'introuvable', page: 1, limit: 12 })));
    expect(await screen.findByText('Aucun événement ne correspond à cette vue')).toBeInTheDocument();
  });

  it('affiche l’état premier événement sans faux bouton de filtre', async () => {
    vi.mocked(eventsService.getMyEvents).mockResolvedValue(page([]));
    renderExperience();

    expect(await screen.findByText('Votre premier événement commence ici.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Créer mon premier événement' })).toHaveAttribute('href', '/evenements/creer');
  });

  it('bascule grille/liste et envoie les filtres détaillés au backend', async () => {
    const user = userEvent.setup();
    renderExperience();
    await screen.findByText('Gala Boréal');

    await user.click(screen.getByRole('button', { name: 'Liste' }));
    expect(screen.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /^Filtres/ }));
    await user.selectOptions(screen.getByLabelText('Visibilité'), 'private');
    await user.selectOptions(screen.getByLabelText('Progression'), 'incomplete');

    await waitFor(() => expect(eventsService.getMyEvents).toHaveBeenLastCalledWith(expect.objectContaining({ discoverability: 'private', progress: 'incomplete' })));
  });

  it('applique les onglets et la pagination serveur', async () => {
    vi.mocked(eventsService.getMyEvents).mockImplementation(async (params) => page([event], 13, params?.page ?? 1));
    const user = userEvent.setup();
    renderExperience();
    await screen.findByText('Gala Boréal');

    await user.click(screen.getByRole('tab', { name: 'À publier' }));
    await waitFor(() => expect(eventsService.getMyEvents).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'ready', page: 1 })));
    await user.click(screen.getByRole('button', { name: 'Page suivante' }));
    await waitFor(() => expect(eventsService.getMyEvents).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'ready', page: 2 })));
  });

  it('permet de parcourir les onglets au clavier', async () => {
    const user = userEvent.setup();
    renderExperience();
    await screen.findByText('Gala Boréal');

    const allTab = screen.getByRole('tab', { name: 'Tous' });
    allTab.focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Brouillons' })).toHaveFocus();
    await waitFor(() => expect(eventsService.getMyEvents).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'draft', page: 1 })));
  });

  it('publie seulement lorsque la readiness backend l’autorise', async () => {
    const user = userEvent.setup();
    renderExperience();
    const publish = await screen.findByRole('button', { name: 'Publier' });
    expect(publish).toBeEnabled();

    await user.click(publish);
    await waitFor(() => expect(eventsService.publish).toHaveBeenCalledWith(event._id));
  });

  it('désactive la publication lorsque la readiness est invalide', async () => {
    vi.mocked(eventsService.getMyEvents).mockResolvedValue(page([{ ...event, readiness: { publishable: false, errors: [{ code: 'START_DATE_REQUIRED', field: 'startDate' }], warnings: [] } }]));
    renderExperience();

    expect(await screen.findByRole('button', { name: 'Publier' })).toBeDisabled();
  });

  it('rend l’erreur et relance la requête', async () => {
    vi.mocked(eventsService.getMyEvents)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(page([event]));
    const user = userEvent.setup();
    renderExperience();

    expect(await screen.findByRole('heading', { name: 'Impossible de charger vos événements' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText('Gala Boréal')).toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Event } from '@/features/events/types';
import { EventCreationWizard } from './EventCreationWizard';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    push: mocks.push,
  }),
}));

vi.mock('@/features/events/services/events.service', () => ({
  eventsService: {
    create: mocks.create,
    update: mocks.update,
  },
}));

vi.mock('@/features/vendors/services/vendors.service', () => ({
  vendorsService: {
    list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
  },
}));

vi.mock('@/features/venues/services/venue-profile.service', () => ({
  venueProfileService: {
    list: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
  },
}));

function renderWizard(initialEvent?: Event) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EventCreationWizard initialEvent={initialEvent} />
    </QueryClientProvider>,
  );
}

function draft(overrides: Partial<Event> = {}): Event {
  return {
    _id: 'event-1',
    title: 'Gala Elintys',
    eventType: 'gala',
    status: 'draft',
    createdAt: '2027-01-01T00:00:00.000Z',
    updatedAt: '2027-01-01T00:00:00.000Z',
    creationProgress: {
      currentStep: 2,
      completedSteps: [1],
      skippedSteps: [],
      lastSavedAt: '2027-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

describe('EventCreationWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valide le titre, crée le draft puis passe à l’étape 2', async () => {
    const user = userEvent.setup();
    mocks.create.mockResolvedValue(draft());
    renderWizard();

    await user.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(
      await screen.findByText('Donnez un nom à votre événement.'),
    ).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole('textbox', { name: 'Nom de l’événement' }),
      'Gala Elintys',
    );
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Gala Elintys',
          creationProgress: expect.objectContaining({
            currentStep: 2,
            completedSteps: [1],
          }),
        }),
      ),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Quand et où imaginez-vous cet événement ?',
      }),
    ).toBeInTheDocument();
    expect(mocks.replace).toHaveBeenCalledWith(
      '/tableau-de-bord/evenements/event-1/configuration?etape=2',
      { scroll: false },
    );
  });

  it('reste sur place et propose un retry si la création échoue', async () => {
    const user = userEvent.setup();
    mocks.create.mockRejectedValueOnce(new Error('network'));
    renderWizard();

    await user.type(
      screen.getByRole('textbox', { name: 'Nom de l’événement' }),
      'Gala Elintys',
    );
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'L’enregistrement a échoué.',
    );
    expect(
      screen.getByRole('heading', { name: 'Donnons vie à votre événement' }),
    ).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('reprend un brouillon à son étape persistée', () => {
    renderWizard(
      draft({
        providerNeeds: [{ category: 'photographer', mode: 'later' }],
        creationProgress: {
          currentStep: 4,
          completedSteps: [1, 2, 3],
          skippedSteps: [],
          lastSavedAt: '2027-01-01T00:00:00.000Z',
        },
      }),
    );

    expect(
      screen.getByRole('heading', {
        name: 'De quels professionnels aurez-vous besoin ?',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Étape 4 sur 6')).toBeInTheDocument();
  });
});

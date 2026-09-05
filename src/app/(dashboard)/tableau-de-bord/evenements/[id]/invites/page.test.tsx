import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventInvitationsPage from './page';
import { eventsService } from '@/features/events/services/events.service';
import { invitationsService } from '@/features/invitations/services/invitations.service';
import type { AdmissionMode, Event } from '@/features/events/types';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'event-1' }) }));
vi.mock('@/features/events/services/events.service', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/events/services/events.service')>();
  return { ...original, eventsService: { get: vi.fn() } };
});
vi.mock('@/features/invitations/services/invitations.service', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/features/invitations/services/invitations.service')>();
  return { ...original, invitationsService: { listByEvent: vi.fn(), create: vi.fn() } };
});

const mockedEvents = vi.mocked(eventsService);
const mockedInvitations = vi.mocked(invitationsService);

function buildEvent(admissionModes: AdmissionMode[]): Event {
  return {
    _id: 'event-1',
    title: 'Gala Boréal',
    status: 'draft',
    discoverability: 'public',
    accessPolicy: { type: 'open' },
    admissionModes,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-02T10:00:00Z',
  } as Event;
}

async function renderPage(admissionModes: AdmissionMode[]) {
  mockedEvents.get.mockResolvedValue(buildEvent(admissionModes));
  mockedInvitations.listByEvent.mockResolvedValue({ data: [], total: 0, page: 1, limit: 25 });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EventInvitationsPage />
    </QueryClientProvider>,
  );
  await screen.findByText('Gala Boréal');
}

describe('EventInvitationsPage — garde-fou du mode d’admission', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devrait masquer le formulaire et expliquer le blocage quand « invitation » est inactif', async () => {
    await renderPage(['registration_only']);

    expect(
      screen.getByText('Les invitations ne sont pas activées pour cet événement'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Courriel/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Activer les invitations' })).toHaveAttribute(
      'href',
      '/tableau-de-bord/evenements/event-1/acces-et-inscriptions',
    );
  });

  it('devrait nommer l’événement concerné dans le message de blocage', async () => {
    await renderPage(['registration_only']);

    expect(screen.getByText(/« Gala Boréal »/)).toBeInTheDocument();
  });

  it('devrait afficher le formulaire quand « invitation » est actif', async () => {
    await renderPage(['registration_only', 'invitation']);

    expect(screen.getByRole('button', { name: 'Envoyer l’invitation' })).toBeInTheDocument();
    expect(
      screen.queryByText('Les invitations ne sont pas activées pour cet événement'),
    ).not.toBeInTheDocument();
  });
});

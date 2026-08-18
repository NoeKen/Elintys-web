import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import { invitationsService } from './invitations.service';

vi.mock('@/shared/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('invitationsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transmet la pagination serveur au endpoint de gestion événement', async () => {
    const response = { data: [], total: 51, page: 2, limit: 25 };
    vi.mocked(api.get).mockResolvedValue({ data: response, status: 200 });

    await expect(invitationsService.listByEvent('event-1', 2, 25)).resolves.toEqual(response);
    expect(api.get).toHaveBeenCalledWith('/events/event-1/invitations', {
      params: { page: 2, limit: 25 },
    });
  });

  it('crée une invitation participant sans champ secret côté client', async () => {
    const invitation = {
      _id: 'invitation-1',
      email: 'participant@example.com',
      name: 'Participant QA',
      type: 'participant' as const,
      status: 'pending' as const,
      sentAt: '2026-08-17T20:00:00.000Z',
    };
    vi.mocked(api.post).mockResolvedValue({ data: invitation, status: 201 });

    await expect(
      invitationsService.create({
        email: invitation.email,
        name: invitation.name,
        type: 'participant',
        eventId: 'event-1',
      }),
    ).resolves.toEqual(invitation);
    expect(api.post).toHaveBeenCalledWith('/invitations', {
      email: invitation.email,
      name: invitation.name,
      type: 'participant',
      eventId: 'event-1',
    });
  });
});

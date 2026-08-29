import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import { ticketsService } from './tickets.service';

vi.mock('@/shared/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const apiTicket = {
  _id: 'ticket-type-1',
  event: 'event-1',
  name: 'Billet QA',
  description: 'Accès général',
  price: 0,
  quantity: 25,
  sold: 3,
};

describe('ticketsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('utilise la route de gestion protégée et normalise le contrat Mongo', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [apiTicket], status: 200 });

    await expect(ticketsService.getTypes('event-1')).resolves.toEqual([
      {
        id: 'ticket-type-1',
        eventId: 'event-1',
        name: 'Billet QA',
        description: 'Accès général',
        price: 0,
        quantity: 25,
        soldCount: 3,
      },
    ]);
    expect(api.get).toHaveBeenCalledWith('/ticket-types/events/event-1/manage');
  });

  it('normalise aussi les réponses de création et de modification', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: apiTicket, status: 201 });
    vi.mocked(api.put).mockResolvedValue({
      data: { ...apiTicket, name: 'Billet modifié' },
      status: 200,
    });

    await expect(
      ticketsService.createType('event-1', {
        name: 'Billet QA',
        isFree: true,
        price: 0,
        quantity: 25,
      }),
    ).resolves.toMatchObject({ id: 'ticket-type-1', soldCount: 3 });
    await expect(
      ticketsService.updateType('ticket-type-1', { name: 'Billet modifié' }),
    ).resolves.toMatchObject({ name: 'Billet modifié', eventId: 'event-1' });
  });

  it('achète un billet gratuit avec idempotence et grant uniquement en headers', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: [], status: 201 });

    await ticketsService.purchaseFree('ticket-type-1', 2, {
      idempotencyKey: 'purchase-attempt-1',
      accessGrant: 'signed-grant',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/tickets/purchase',
      { ticketTypeId: 'ticket-type-1', quantity: 2 },
      {
        headers: {
          'Idempotency-Key': 'purchase-attempt-1',
          'X-Event-Access-Grant': 'signed-grant',
        },
      },
    );
  });
});

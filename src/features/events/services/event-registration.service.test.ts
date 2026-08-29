import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import { eventRegistrationService } from './event-registration.service';

vi.mock('@/shared/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('eventRegistrationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transmet la clé idempotente et le grant uniquement dans les headers', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { _id: 'registration-1', eventId: 'event-1', status: 'active' },
      status: 201,
    });

    await eventRegistrationService.register('event-1', {
      idempotencyKey: 'attempt-1',
      accessGrant: 'signed-grant',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/event-registrations',
      { eventId: 'event-1' },
      {
        headers: {
          'Idempotency-Key': 'attempt-1',
          'X-Event-Access-Grant': 'signed-grant',
        },
      },
    );
  });

  it('ne fabrique aucune identité participant côté client', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { _id: 'registration-1', eventId: 'event-1', status: 'active' },
      status: 201,
    });
    await eventRegistrationService.register('event-1', { idempotencyKey: 'attempt-2' });
    expect(api.post).toHaveBeenCalledWith(
      '/event-registrations',
      { eventId: 'event-1' },
      { headers: { 'Idempotency-Key': 'attempt-2' } },
    );
  });
});

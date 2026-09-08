import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import { guestsService } from './guests.service';

vi.mock('@/shared/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('guestsService canonical transport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists guests through the shared cookie-aware client', async () => {
    const payload = { data: [], total: 0, page: 2 };
    vi.mocked(api.get).mockResolvedValue({ data: payload, status: 200 });

    await expect(guestsService.list('event-1', 2)).resolves.toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/events/event-1/guests', {
      params: { page: 2, limit: 50 },
    });
  });

  it('keeps guest writes scoped to the event path', async () => {
    const guest = { _id: 'guest-1', name: 'Ana', status: 'confirmed', createdAt: '2026-01-01' } as const;
    vi.mocked(api.post).mockResolvedValue({ data: guest, status: 201 });
    vi.mocked(api.put).mockResolvedValue({ data: guest, status: 200 });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined, status: 204 });

    await guestsService.add('event-1', { name: 'Ana' });
    await guestsService.updateStatus('event-1', 'guest-1', 'confirmed');
    await expect(guestsService.remove('event-1', 'guest-1')).resolves.toBeUndefined();

    expect(api.post).toHaveBeenCalledWith('/events/event-1/guests', { name: 'Ana' });
    expect(api.put).toHaveBeenCalledWith('/events/event-1/guests/guest-1', { status: 'confirmed' });
    expect(api.delete).toHaveBeenCalledWith('/events/event-1/guests/guest-1');
  });
});

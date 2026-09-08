import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import { notificationsService } from './notifications.service';

vi.mock('@/shared/lib/api', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

describe('notificationsService canonical transport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists and counts through the shared cookie-aware client', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [], status: 200 })
      .mockResolvedValueOnce({ data: { count: 3 }, status: 200 });

    await expect(notificationsService.list(true, 2)).resolves.toEqual([]);
    await expect(notificationsService.countUnread()).resolves.toEqual({ count: 3 });

    expect(api.get).toHaveBeenNthCalledWith(1, '/notifications/me', {
      params: { page: 2, unreadOnly: true },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/notifications/me/unread-count');
  });

  it('preserves both 204 mutations', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: undefined, status: 204 });

    await expect(notificationsService.markRead('notification-1')).resolves.toBeUndefined();
    await expect(notificationsService.markAllRead()).resolves.toBeUndefined();

    expect(api.patch).toHaveBeenNthCalledWith(1, '/notifications/notification-1/read');
    expect(api.patch).toHaveBeenNthCalledWith(2, '/notifications/read-all');
  });
});

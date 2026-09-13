import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/lib/api', () => ({ default: { get } }));

import { accountService } from './account.service';

describe('accountService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('charge uniquement les commandes du compte via la route owned', async () => {
    get.mockResolvedValue({
      data: { data: [], total: 0, page: 2, limit: 10 },
      status: 200,
    });

    const result = await accountService.getPurchases({ page: 2, limit: 10 });

    expect(get).toHaveBeenCalledWith('/ticket-orders/me', {
      params: { page: 2, limit: 10 },
    });
    expect(result).toEqual({ data: [], total: 0, page: 2, limit: 10 });
  });
});

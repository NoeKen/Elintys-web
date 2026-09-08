import { describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import { waitlistService } from './waitlist.service';

vi.mock('@/shared/lib/api', () => ({
  default: { post: vi.fn() },
}));

describe('waitlistService canonical transport', () => {
  it('joins through the shared client without a parallel fetch implementation', async () => {
    const input = {
      firstName: 'Ana',
      email: 'ana@example.com',
      role: 'organisateur' as const,
      source: 'cta' as const,
      consentMarketing: true,
    };
    const result = { success: true, alreadyExists: false };
    vi.mocked(api.post).mockResolvedValue({ data: result, status: 201 });

    await expect(waitlistService.join(input)).resolves.toEqual(result);
    expect(api.post).toHaveBeenCalledWith('/waitlist', input);
  });
});

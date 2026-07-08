import type { JoinWaitlistInput, JoinWaitlistResult } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export const waitlistService = {
  async join(input: JoinWaitlistInput): Promise<JoinWaitlistResult> {
    const res = await fetch(`${API_URL}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
    }

    return data as JoinWaitlistResult;
  },

  async count(): Promise<number> {
    const res = await fetch(`${API_URL}/waitlist/count`, { next: { revalidate: 60 } });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data?.count === 'number' ? data.count : 0;
  },
};

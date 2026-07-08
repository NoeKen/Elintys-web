const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export type FavoriteTargetType = 'event' | 'vendor' | 'venue';

export interface Favorite {
  _id: string;
  targetType: FavoriteTargetType;
  targetId: string;
  createdAt: string;
}

async function authFetch<T>(
  url: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

export const favoritesAuthService = {
  async list(token: string, targetType?: FavoriteTargetType): Promise<Favorite[]> {
    const params = targetType ? `?targetType=${targetType}` : '';
    return authFetch<Favorite[]>(`/favorites/me${params}`, token);
  },

  async add(token: string, targetType: FavoriteTargetType, targetId: string): Promise<Favorite> {
    return authFetch<Favorite>('/favorites', token, {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
    });
  },

  async remove(token: string, targetType: FavoriteTargetType, targetId: string): Promise<void> {
    return authFetch<void>('/favorites', token, {
      method: 'DELETE',
      body: JSON.stringify({ targetType, targetId }),
    });
  },
};

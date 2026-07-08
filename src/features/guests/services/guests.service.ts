const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface Guest {
  _id: string;
  name: string;
  email?: string;
  status: 'invited' | 'confirmed' | 'declined' | 'present';
  note?: string;
  createdAt: string;
}

export interface GuestListResponse {
  data: Guest[];
  total: number;
  page: number;
}

export interface CreateGuestData {
  name: string;
  email?: string;
  note?: string;
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

export const guestsService = {
  async list(token: string, eventId: string, page = 1): Promise<GuestListResponse> {
    return authFetch<GuestListResponse>(
      `/events/${eventId}/guests?page=${page}&limit=50`,
      token,
    );
  },

  async add(token: string, eventId: string, data: CreateGuestData): Promise<Guest> {
    return authFetch<Guest>(`/events/${eventId}/guests`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(
    token: string,
    eventId: string,
    guestId: string,
    status: Guest['status'],
  ): Promise<Guest> {
    return authFetch<Guest>(`/events/${eventId}/guests/${guestId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async remove(token: string, eventId: string, guestId: string): Promise<void> {
    return authFetch<void>(`/events/${eventId}/guests/${guestId}`, token, {
      method: 'DELETE',
    });
  },
};

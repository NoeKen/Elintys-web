const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface AppNotification {
  _id: string;
  type:
    | 'VENDOR_RESPONDED'
    | 'TICKET_SOLD'
    | 'VENUE_CONFIRMED'
    | 'INVITATION_ACCEPTED'
    | 'EVENT_REMINDER';
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

async function authFetch<T>(
  url: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const authHeader: Record<string, string> = {};
  if (token && token !== 'cookie-session') authHeader.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
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

export const notificationsService = {
  async list(token: string, unreadOnly = false, page = 1): Promise<AppNotification[]> {
    const params = new URLSearchParams({ page: String(page) });
    if (unreadOnly) params.set('unreadOnly', 'true');
    return authFetch<AppNotification[]>(`/notifications/me?${params.toString()}`, token);
  },

  async countUnread(token: string): Promise<UnreadCountResponse> {
    return authFetch<UnreadCountResponse>('/notifications/me/unread-count', token);
  },

  async markRead(token: string, id: string): Promise<void> {
    return authFetch<void>(`/notifications/${id}/read`, token, {
      method: 'PATCH',
    });
  },

  async markAllRead(token: string): Promise<void> {
    return authFetch<void>('/notifications/read-all', token, {
      method: 'PATCH',
    });
  },
};

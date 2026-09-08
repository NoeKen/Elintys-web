import api from '@/shared/lib/api';

export interface AppNotification {
  _id: string;
  type:
    | 'VENDOR_RESPONDED'
    | 'VENDOR_REQUEST_RECEIVED'
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

export const notificationsService = {
  async list(unreadOnly = false, page = 1): Promise<AppNotification[]> {
    const response = await api.get<AppNotification[]>('/notifications/me', {
      params: { page, unreadOnly: unreadOnly || undefined },
    });
    return response.data;
  },

  async countUnread(): Promise<UnreadCountResponse> {
    const response = await api.get<UnreadCountResponse>('/notifications/me/unread-count');
    return response.data;
  },

  async markRead(id: string): Promise<void> {
    await api.patch<void>(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch<void>('/notifications/read-all');
  },
};

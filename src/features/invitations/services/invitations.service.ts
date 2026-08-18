import api from '@/shared/lib/api';

export interface CreateInvitationInput {
  email: string;
  name: string;
  type: 'vendor' | 'venue' | 'participant';
  category?: string;
  eventId?: string;
}

export interface Invitation {
  _id: string;
  email: string;
  name: string;
  type: 'vendor' | 'venue' | 'participant';
  category?: string;
  eventId?: string;
  status: 'pending' | 'accepted' | 'expired';
  sentAt: string;
}

/**
 * Organizer-facing invitation DTO — mirrors OrganizerInvitationDto from the backend.
 * NOTE: `token` and `tokenHash` are NOT present here by design. The API strips them.
 */
export interface OrganizerInvitation {
  _id: string;
  email: string;
  name: string;
  type: 'vendor' | 'venue' | 'participant';
  status: 'pending' | 'accepted' | 'expired';
  maxUses: number;
  useCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface PaginatedOrganizerInvitations {
  data: OrganizerInvitation[];
  total: number;
  page: number;
  limit: number;
}

export const invitationsService = {
  async create(input: CreateInvitationInput): Promise<Invitation> {
    const response = await api.post<Invitation>('/invitations', input);
    return response.data;
  },

  async accept(token: string): Promise<Invitation> {
    const response = await api.post<Invitation>(`/invitations/accept/${encodeURIComponent(token)}`);
    return response.data;
  },

  async listByEvent(eventId: string, page = 1, limit = 25): Promise<PaginatedOrganizerInvitations> {
    const response = await api.get<PaginatedOrganizerInvitations>(`/events/${eventId}/invitations`, {
      params: { page, limit },
    });
    return response.data;
  },
};

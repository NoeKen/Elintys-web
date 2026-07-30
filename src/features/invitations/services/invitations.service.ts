import api from '@/shared/lib/api';

export interface CreateInvitationInput {
  email: string;
  name: string;
  type: 'vendor' | 'venue';
  category?: string;
  eventId?: string;
}

export interface Invitation {
  _id: string;
  email: string;
  name: string;
  type: 'vendor' | 'venue';
  category?: string;
  eventId?: string;
  status: 'pending' | 'accepted' | 'expired';
  sentAt: string;
}

export const invitationsService = {
  async create(input: CreateInvitationInput): Promise<Invitation> {
    const response = await api.post<Invitation>('/invitations', input);
    return response.data;
  },
};

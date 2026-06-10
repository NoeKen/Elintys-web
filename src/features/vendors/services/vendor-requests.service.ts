import api from '@/shared/lib/api';

export interface VendorRequest {
  _id: string;
  event: string;
  vendor?: { _id: string; businessName: string; category: string } | string;
  organizer: string;
  source: 'platform' | 'manual';
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  responseMessage?: string;
  respondedAt?: string;
  externalContact?: { name: string; email: string; phone?: string };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVendorRequestPayload {
  vendorId?: string;
  source?: 'platform' | 'manual';
  message?: string;
  externalContact?: { name: string; email: string; phone?: string };
}

export interface RespondVendorRequestPayload {
  status: 'accepted' | 'declined';
  responseMessage?: string;
}

export const vendorRequestsService = {
  async listByEvent(eventId: string): Promise<VendorRequest[]> {
    const res = await api.get<VendorRequest[]>(`/vendors/${eventId}/requests`);
    return res.data;
  },

  async create(eventId: string, payload: CreateVendorRequestPayload): Promise<VendorRequest> {
    const res = await api.post<VendorRequest>(`/vendors/${eventId}/requests`, payload);
    return res.data;
  },

  async listMine(): Promise<VendorRequest[]> {
    const res = await api.get<VendorRequest[]>('/vendors/requests/my');
    return res.data;
  },

  async respond(requestId: string, payload: RespondVendorRequestPayload): Promise<VendorRequest> {
    const res = await api.patch<VendorRequest>(`/vendors/requests/${requestId}/respond`, payload);
    return res.data;
  },

  async cancel(requestId: string): Promise<void> {
    await api.delete(`/vendors/requests/${requestId}`);
  },
};

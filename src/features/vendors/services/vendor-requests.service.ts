import api from '@/shared/lib/api';

/** Référence peuplée ou brute selon l'endpoint appelé. */
export type VendorRequestEvent = string | null | { _id: string; title: string; startDate?: string; slug?: string };
export type VendorRequestOrganizer = string | null | { _id: string; fullName: string };

export interface VendorRequest {
  _id: string;
  event: VendorRequestEvent;
  vendor?: { _id: string; businessName: string; category: string } | string;
  organizer: VendorRequestOrganizer;
  source: 'platform' | 'manual';
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  responseMessage?: string;
  respondedAt?: string;
  externalContact?: { name: string; email?: string; phone?: string; category?: string };
  createdAt: string;
  updatedAt?: string;
}

/**
 * Le schéma `User` porte `fullName` — il n'existe ni `firstName` ni
 * `lastName` côté serveur. Lire ces champs produisait un nom vide.
 */
export function organizerName(organizer: VendorRequestOrganizer): string | undefined {
  // `typeof null === 'object'` : sans le test de nullité, une référence
  // supprimée fait planter l'écran au lieu d'afficher un repli.
  return organizer !== null && typeof organizer === 'object' ? organizer.fullName : undefined;
}

export function eventTitle(event: VendorRequestEvent): string | undefined {
  // Idem : un événement supprimé arrive à `null`, pas à `undefined`.
  return event !== null && typeof event === 'object' ? event.title : undefined;
}

export interface CreateVendorRequestPayload {
  vendorId?: string;
  source?: 'platform' | 'manual';
  message?: string;
  externalContact?: { name: string; email?: string; phone?: string; category?: string };
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

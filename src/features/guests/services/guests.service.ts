import api from "@/lib/api";
import type { PaginatedResponse } from "@/types";
import type { Guest, CreateGuestInput, GuestStatus } from "../types";

export const guestsService = {
  async listByEvent(eventId: string, page = 1, perPage = 50): Promise<PaginatedResponse<Guest>> {
    const res = await api.get<PaginatedResponse<Guest>>(`/events/${eventId}/guests`, {
      params: { page, perPage },
    });
    return res.data;
  },

  async create(data: CreateGuestInput): Promise<Guest> {
    const res = await api.post<Guest>(`/events/${data.eventId}/guests`, data);
    return res.data;
  },

  async updateStatus(eventId: string, guestId: string, status: GuestStatus): Promise<Guest> {
    const res = await api.patch<Guest>(`/events/${eventId}/guests/${guestId}`, { status });
    return res.data;
  },

  async delete(eventId: string, guestId: string): Promise<void> {
    await api.delete(`/events/${eventId}/guests/${guestId}`);
  },
};

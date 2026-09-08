import api from "@/shared/lib/api";
import type {
  CreateGuestInput,
  Guest,
  GuestListResponse,
  GuestStatus,
} from "../types";

export const guestsService = {
  async list(eventId: string, page = 1): Promise<GuestListResponse> {
    const response = await api.get<GuestListResponse>(
      `/events/${eventId}/guests`,
      { params: { page, limit: 50 } },
    );
    return response.data;
  },

  async add(eventId: string, data: CreateGuestInput): Promise<Guest> {
    const response = await api.post<Guest>(`/events/${eventId}/guests`, data);
    return response.data;
  },

  async updateStatus(
    eventId: string,
    guestId: string,
    status: GuestStatus,
  ): Promise<Guest> {
    const response = await api.put<Guest>(
      `/events/${eventId}/guests/${guestId}`,
      { status },
    );
    return response.data;
  },

  async remove(eventId: string, guestId: string): Promise<void> {
    await api.delete<void>(`/events/${eventId}/guests/${guestId}`);
  },
};

import api from "@/lib/api";
import type { PaginatedResponse } from "@/types";
import type { Ticket, TicketType } from "../types";

export const ticketsService = {
  async listByEvent(eventId: string, page = 1, perPage = 50): Promise<PaginatedResponse<Ticket>> {
    const res = await api.get<PaginatedResponse<Ticket>>(`/events/${eventId}/tickets`, {
      params: { page, perPage },
    });
    return res.data;
  },

  async getTypes(eventId: string): Promise<TicketType[]> {
    const res = await api.get<TicketType[]>(`/events/${eventId}/ticket-types`);
    return res.data;
  },

  async validate(code: string): Promise<Ticket> {
    const res = await api.post<Ticket>("/tickets/validate", { code });
    return res.data;
  },
};

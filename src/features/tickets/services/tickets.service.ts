import api from "@/shared/lib/api";
import type { PaginatedResponse } from "@/shared/types";
import type { Ticket, TicketType } from "../types";

interface ApiTicketType {
  _id: string;
  event: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold: number;
}

function normalizeTicketType(type: ApiTicketType): TicketType {
  return {
    id: type._id,
    eventId: type.event,
    name: type.name,
    description: type.description,
    price: type.price,
    quantity: type.quantity,
    soldCount: type.sold,
  };
}

export interface CreateTicketTypeDto {
  name: string;
  description?: string;
  isFree: boolean;
  price: number;
  quantity: number;
}

export interface UpdateTicketTypeDto {
  name?: string;
  description?: string;
  isFree?: boolean;
  price?: number;
  quantity?: number;
}

export const ticketsService = {
  async listByEvent(eventId: string, page = 1, perPage = 50): Promise<PaginatedResponse<Ticket>> {
    const res = await api.get<PaginatedResponse<Ticket>>(`/events/${eventId}/tickets`, {
      params: { page, perPage },
    });
    return res.data;
  },

  async getTypes(eventId: string): Promise<TicketType[]> {
    const res = await api.get<ApiTicketType[]>(`/ticket-types/events/${eventId}/manage`);
    return res.data.map(normalizeTicketType);
  },

  async createType(eventId: string, dto: CreateTicketTypeDto): Promise<TicketType> {
    const res = await api.post<ApiTicketType>(`/ticket-types/events/${eventId}`, dto);
    return normalizeTicketType(res.data);
  },

  async updateType(typeId: string, dto: UpdateTicketTypeDto): Promise<TicketType> {
    const res = await api.put<ApiTicketType>(`/ticket-types/${typeId}`, dto);
    return normalizeTicketType(res.data);
  },

  async deleteType(typeId: string): Promise<void> {
    await api.delete<void>(`/ticket-types/${typeId}`);
  },

  async validate(code: string): Promise<Ticket> {
    const res = await api.post<Ticket>("/tickets/validate", { code });
    return res.data;
  },
};

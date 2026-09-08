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
  reserved?: number;
  isFree?: boolean;
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
    reservedCount: type.reserved ?? 0,
    isFree: type.isFree ?? false,
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

export interface PurchaseFreeTicketOptions {
  idempotencyKey: string;
  accessGrant?: string;
}

export interface TicketPurchaseResult {
  _id: string;
  event: string;
  ticketType: string;
  price: number;
  qrCode?: string;
  status: string;
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

  async purchaseFree(
    ticketTypeId: string,
    quantity: number,
    options: PurchaseFreeTicketOptions,
  ): Promise<TicketPurchaseResult[]> {
    const res = await api.post<TicketPurchaseResult[]>(
      "/tickets/purchase",
      { ticketTypeId, quantity },
      {
        headers: {
          "Idempotency-Key": options.idempotencyKey,
          ...(options.accessGrant ? { "X-Event-Access-Grant": options.accessGrant } : {}),
        },
      },
    );
    return res.data;
  },
};

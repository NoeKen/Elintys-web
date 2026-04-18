export type TicketStatus = "active" | "used" | "cancelled" | "refunded";

export interface Ticket {
  id: string;
  eventId: string;
  guestId?: string;
  code: string;
  status: TicketStatus;
  price: number;
  currency: string;
  purchasedAt?: string;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  soldCount: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

export type GuestStatus = "pending" | "confirmed" | "declined" | "no_show";

export interface Guest {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: GuestStatus;
  tableNumber?: number;
  plusOne: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestInput {
  eventId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  plusOne?: boolean;
  tableNumber?: number;
  notes?: string;
}

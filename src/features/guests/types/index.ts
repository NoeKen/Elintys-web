export type GuestStatus = "invited" | "confirmed" | "declined" | "present";

export interface Guest {
  _id: string;
  name: string;
  email?: string;
  status: GuestStatus;
  note?: string;
  createdAt: string;
}

export interface CreateGuestInput {
  name: string;
  email?: string;
  note?: string;
}

export interface GuestListResponse {
  data: Guest[];
  total: number;
  page: number;
}

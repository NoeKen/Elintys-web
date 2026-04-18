export type EventStatus = "draft" | "published" | "ongoing" | "completed" | "cancelled";

export interface Event {
  id: string;
  title: string;
  description?: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location?: string;
  coverImageUrl?: string;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
}

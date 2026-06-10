export type EventStatus = "draft" | "published" | "ongoing" | "completed" | "cancelled";

export type EventLocationType = 'physical' | 'online' | 'hybrid';

export interface EventLocation {
  type: EventLocationType;
  address?: string;
  city?: string;
  onlineUrl?: string;
}

export interface Event {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location?: EventLocation;
  coverImageUrl?: string;
  organizerId: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  visibility?: 'public' | 'private' | 'invite_only';
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
}

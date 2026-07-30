import type {
  MediaImage,
  MediaImageSource,
} from '@/shared/types/media.types';

export type { MediaImage } from '@/shared/types/media.types';

export type EventStatus = "draft" | "published" | "ongoing" | "completed" | "cancelled";

export type EventLocationType = 'physical' | 'online' | 'hybrid';
export type EventType =
  | 'conference'
  | 'wedding'
  | 'gala'
  | 'concert'
  | 'festival'
  | 'workshop'
  | 'corporate'
  | 'birthday'
  | 'networking'
  | 'other';
export type VenueMode = 'existing' | 'search' | 'later';
export type ProviderSelectionMode = 'elintys' | 'manual' | 'later';

export interface EventLocation {
  type: EventLocationType;
  name?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  onlineUrl?: string;
}

export interface EventProviderNeed {
  category: string;
  mode: ProviderSelectionMode;
}

export interface EventAccessRules {
  privateLink?: boolean;
  accessCode?: boolean;
  allowedEmailDomain?: string;
  manualApproval?: boolean;
}

export interface EventCreationProgress {
  currentStep: number;
  completedSteps: number[];
  skippedSteps: number[];
  lastSavedAt: string;
}

export interface Event {
  _id: string;
  id?: string;
  title: string;
  eventType?: EventType;
  shortDescription?: string;
  description?: string;
  status: EventStatus;
  startDate?: string;
  endDate?: string;
  location?: EventLocation;
  coverImage?: MediaImageSource;
  gallery?: MediaImage[];
  timezone?: string;
  dateIsTentative?: boolean;
  venueMode?: VenueMode;
  venueProfile?: string | null;
  visibility?: 'public' | 'private' | 'invite_only';
  accessRules?: EventAccessRules | null;
  capacity?: number;
  providerNeeds?: EventProviderNeed[];
  creationProgress?: EventCreationProgress;
  organizer?: string;
  organizerId?: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  eventType?: EventType;
  shortDescription?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: EventLocation;
  timezone?: string;
  dateIsTentative?: boolean;
  venueMode?: VenueMode;
  venueProfile?: string | null;
  visibility?: 'public' | 'private' | 'invite_only';
  accessRules?: EventAccessRules | null;
  capacity?: number;
  providerNeeds?: EventProviderNeed[];
  creationProgress?: Omit<EventCreationProgress, 'lastSavedAt'>;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
}

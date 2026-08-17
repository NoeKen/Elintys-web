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
export type EventDiscoverability = 'public' | 'unlisted' | 'private';
export type EventAccessPolicyType =
  | 'open'
  | 'registration_required'
  | 'access_code'
  | 'email_domain'
  | 'manual_approval'
  | 'guest_list'
  | 'invitation_token';
export type AdmissionMode =
  | 'free'
  | 'registration_only'
  | 'free_ticket'
  | 'paid_ticket'
  | 'invitation';

export type EventAccessPolicy =
  | { type: 'open' }
  | { type: 'registration_required'; requiresAuthentication?: boolean }
  | { type: 'access_code'; code?: string; hasAccessCode?: boolean }
  | { type: 'email_domain'; allowedDomains: string[]; requiresAuthentication?: boolean }
  | { type: 'manual_approval'; requiresAuthentication?: boolean }
  | { type: 'guest_list'; requiresAuthentication?: boolean }
  | { type: 'invitation_token' };

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

export type EventAccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface EventAccessRequest {
  _id: string;
  eventId: string;
  userId: string | {
    _id: string;
    fullName: string;
    email: string;
  };
  status: EventAccessRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
}

export interface Event {
  _id: string;
  id?: string;
  title: string;
  eventType?: EventType;
  shortDescription?: string;
  description?: string;
  status: EventStatus;
  archivedAt?: string | null;
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
  discoverability?: EventDiscoverability;
  accessPolicy?: EventAccessPolicy;
  admissionModes?: AdmissionMode[];
  accessModelVersion?: number;
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
  discoverability?: EventDiscoverability;
  accessPolicy?: EventAccessPolicy;
  admissionModes?: AdmissionMode[];
  capacity?: number;
  providerNeeds?: EventProviderNeed[];
  creationProgress?: Omit<EventCreationProgress, 'lastSavedAt'>;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
}

export interface PublicEventVenue {
  _id: string;
  name: string;
  type: string;
  description?: string;
  address: {
    street: string;
    city: string;
    province?: string;
    postalCode?: string;
  };
  capacity: number;
  photos: string[];
  amenities: string[];
  rating: number;
  reviewCount: number;
}

export interface PublicEventProvider {
  _id: string;
  businessName: string;
  category: string;
  description?: string;
  photos: string[];
  serviceArea: string;
  rating: number;
  reviewCount: number;
}

export interface PublicEventTicketType {
  _id: string;
  name: string;
  price: number;
  isFree: boolean;
  quantity: number;
  sold: number;
  description?: string;
}

export interface PublicRelatedEvent {
  _id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  eventType?: EventType;
  coverImage?: MediaImageSource;
  startDate: string;
  endDate?: string;
  location?: Pick<EventLocation, 'type' | 'name' | 'address' | 'city' | 'province' | 'postalCode'>;
}

export interface PublicEventDetail {
  _id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  eventType?: EventType;
  coverImage?: MediaImageSource;
  gallery: MediaImageSource[];
  startDate: string;
  endDate?: string;
  timezone: string;
  dateIsTentative: boolean;
  location?: Pick<EventLocation, 'type' | 'name' | 'address' | 'city' | 'province' | 'postalCode'>;
  capacity?: number;
  discoverability: Extract<EventDiscoverability, 'public' | 'unlisted'>;
  accessPolicy: {
    type: EventAccessPolicyType;
    requiresAuthentication?: boolean;
    hasAccessCode?: boolean;
  };
  admissionModes: AdmissionMode[];
  organizer?: { name: string };
  venue?: PublicEventVenue;
  providers: PublicEventProvider[];
  ticketTypes: PublicEventTicketType[];
  relatedEvents: PublicRelatedEvent[];
  updatedAt?: string;
}

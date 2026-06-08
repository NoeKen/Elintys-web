// ─── Events ──────────────────────────────────────────────────────────────────

export interface Event {
  _id: string;
  organizerId: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  startDate: string;
  endDate?: string;
  locationType: 'physical' | 'online' | 'hybrid';
  locationAddress?: string;
  locationCity?: string;
  eventType: 'public' | 'private' | 'invitation';
  status: 'draft' | 'published';
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export type VendorCategory =
  | 'photographer'
  | 'caterer'
  | 'decorator'
  | 'animator'
  | 'dj'
  | 'sound'
  | 'other';

export interface VendorProfile {
  _id: string;
  userId: string;
  businessName: string;
  category: VendorCategory;
  description: string;
  photos: string[];
  minPrice: number;
  maxPrice: number;
  currency: string;
  serviceArea: string;
  isActive: boolean;
  createdAt: string;
}

export type VendorRequestSource = 'platform' | 'manual';
export type VendorRequestStatus = 'pending' | 'accepted' | 'declined';

export interface ExternalVendorContact {
  name: string;
  email?: string;
  phone?: string;
  category?: string;
}

export interface VendorRequest {
  _id: string;
  event: string;
  vendor?: string;
  organizer: string;
  message?: string;
  status: VendorRequestStatus;
  responseMessage?: string;
  respondedAt?: string;
  source: VendorRequestSource;
  externalContact?: ExternalVendorContact | null;
  createdAt: string;
}

// ─── Venues ──────────────────────────────────────────────────────────────────

export interface VenueProfile {
  _id: string;
  userId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  capacityMin: number;
  capacityMax: number;
  pricePerDay: number;
  currency: string;
  photos: string[];
  amenities: string[];
  isActive: boolean;
  createdAt: string;
}

export type VenueBookingSource = 'platform' | 'manual' | 'external';
export type VenueBookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface ExternalVenueContact {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface VenueBooking {
  _id: string;
  event: string;
  venue?: string;
  organizer: string;
  bookingStart?: string;
  bookingEnd?: string;
  message?: string;
  status: VenueBookingStatus;
  totalPrice?: number;
  currency: string;
  responseMessage?: string;
  respondedAt?: string;
  source: VenueBookingSource;
  externalContact?: ExternalVenueContact | null;
  createdAt: string;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export interface TicketType {
  _id: string;
  event: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  isFree: boolean;
  description?: string;
  createdAt: string;
}

export type TicketPurchaseStatus = 'pending' | 'valid' | 'used' | 'cancelled' | 'refunded';

export interface TicketPurchase {
  _id: string;
  event: string;
  ticketType: string;
  buyerId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  price: number;
  qrCode?: string;
  status: TicketPurchaseStatus;
  stripePaymentIntentId?: string;
  scannedAt?: string;
  createdAt: string;
}

// ─── Invitations ─────────────────────────────────────────────────────────────

export type InvitationType = 'vendor' | 'venue';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export interface Invitation {
  _id: string;
  invitedBy: string;
  email: string;
  name: string;
  type: InvitationType;
  category?: string;
  eventId?: string;
  status: InvitationStatus;
  token: string;
  acceptedAt?: string;
  convertedUserId?: string;
  expiresAt: string;
  createdAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'VENDOR_RESPONDED'
  | 'TICKET_SOLD'
  | 'VENUE_CONFIRMED'
  | 'INVITATION_ACCEPTED'
  | 'EVENT_REMINDER';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export type ReviewTargetType = 'vendor' | 'venue';

export interface Review {
  _id: string;
  authorId: string;
  targetId: string;
  targetType: ReviewTargetType;
  rating: number;
  comment?: string;
  createdAt: string;
}

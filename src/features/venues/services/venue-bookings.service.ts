import api from '@/shared/lib/api';

export type VenueBookingEvent = string | { _id: string; title: string; startDate?: string; slug?: string };
export type VenueBookingOrganizer = string | { _id: string; fullName: string };

export interface VenueBooking {
  _id: string;
  event: VenueBookingEvent;
  venue?: string | { _id: string; name?: string };
  organizer: VenueBookingOrganizer;
  bookingStart: string;
  bookingEnd: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'refused' | 'cancelled';
  totalPrice?: number;
  currency?: string;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Voir vendor-requests.service : le serveur expose `fullName`, pas firstName. */
export function organizerName(organizer: VenueBookingOrganizer): string | undefined {
  return typeof organizer === 'object' ? organizer.fullName : undefined;
}

export function eventTitle(event: VenueBookingEvent): string | undefined {
  return typeof event === 'object' ? event.title : undefined;
}

export interface CreateVenueBookingPayload {
  venueId: string;
  bookingStart: string;
  bookingEnd: string;
  message?: string;
  totalPrice?: number;
}

export interface RespondVenueBookingPayload {
  status: 'confirmed' | 'refused';
  responseMessage?: string;
}

export const venueBookingsService = {
  async listByEvent(eventId: string): Promise<VenueBooking[]> {
    const res = await api.get<VenueBooking[]>(`/venues/${eventId}/bookings`);
    return res.data;
  },

  async create(eventId: string, payload: CreateVenueBookingPayload): Promise<VenueBooking> {
    const res = await api.post<VenueBooking>(`/venues/${eventId}/bookings`, payload);
    return res.data;
  },

  async listMine(): Promise<VenueBooking[]> {
    const res = await api.get<VenueBooking[]>('/venues/bookings/my');
    return res.data;
  },

  async respond(bookingId: string, payload: RespondVenueBookingPayload): Promise<VenueBooking> {
    const res = await api.patch<VenueBooking>(`/venues/bookings/${bookingId}/respond`, payload);
    return res.data;
  },
};

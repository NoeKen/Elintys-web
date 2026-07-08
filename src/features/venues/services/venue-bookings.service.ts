import api from '@/shared/lib/api';

export interface VenueBooking {
  _id: string;
  event: string | { _id: string; title: string; startDate: string };
  venue?: string | { _id: string; name?: string };
  organizer: string;
  bookingStart: string;
  bookingEnd: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'refused' | 'cancelled';
  totalPrice?: number;
  responseMessage?: string;
  createdAt: string;
  updatedAt?: string;
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

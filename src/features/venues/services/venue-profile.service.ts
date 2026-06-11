const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface VenueProfile {
  _id: string;
  name: string;
  description?: string;
  address: { street: string; city: string; province: string; postalCode?: string };
  capacity: number;
  photos: string[];
  amenities: string[];
  pricePerDay?: number;
  contactEmail?: string;
  contactPhone?: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

export interface VenueBooking {
  _id: string;
  event: { _id: string; title: string; startDate: string };
  organizer: { _id: string; firstName: string; lastName: string };
  status: 'pending' | 'confirmed' | 'refused' | 'cancelled';
  bookingStart: string;
  bookingEnd: string;
  message?: string;
  totalPrice?: number;
  currency: string;
  createdAt: string;
}

async function authFetch<T>(
  url: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

export const venueProfileService = {
  async getMyProfile(token: string): Promise<VenueProfile> {
    return authFetch<VenueProfile>('/venues/me', token);
  },

  async updateProfile(token: string, data: Partial<VenueProfile>): Promise<VenueProfile> {
    return authFetch<VenueProfile>('/venues/me', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getMyBookings(token: string): Promise<VenueBooking[]> {
    return authFetch<VenueBooking[]>('/venues/bookings/my', token);
  },

  async respondToBooking(
    token: string,
    bookingId: string,
    status: 'confirmed' | 'refused',
    message?: string,
  ): Promise<VenueBooking> {
    return authFetch<VenueBooking>(`/venues/bookings/${bookingId}/respond`, token, {
      method: 'PUT',
      body: JSON.stringify({ status, ...(message !== undefined && { message }) }),
    });
  },
};

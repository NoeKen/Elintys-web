const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface VendorProfile {
  _id: string;
  businessName: string;
  category: string;
  description?: string;
  serviceArea?: string;
  photos: string[];
  rating: number;
  reviewCount: number;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}

export interface VendorRequest {
  _id: string;
  event: { _id: string; title: string; startDate: string };
  organizer: { _id: string; firstName: string; lastName: string };
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  source: 'platform' | 'manual' | 'external';
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

export const vendorProfileService = {
  async getMyProfile(token: string): Promise<VendorProfile> {
    return authFetch<VendorProfile>('/vendors/me', token);
  },

  async updateProfile(token: string, data: Partial<VendorProfile>): Promise<VendorProfile> {
    return authFetch<VendorProfile>('/vendors/me', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getMyRequests(token: string): Promise<VendorRequest[]> {
    return authFetch<VendorRequest[]>('/vendors/requests/my', token);
  },

  async respondToRequest(
    token: string,
    requestId: string,
    status: 'accepted' | 'declined',
    message?: string,
  ): Promise<VendorRequest> {
    return authFetch<VendorRequest>(`/vendors/requests/${requestId}/respond`, token, {
      method: 'PUT',
      body: JSON.stringify({ status, ...(message !== undefined && { message }) }),
    });
  },
};

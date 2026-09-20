import api, { ApiClientError } from "@/shared/lib/api";

export interface VenueAddress {
  street: string;
  city: string;
  province?: string;
  postalCode?: string;
}

export interface Venue {
  _id: string;
  name: string;
  type?: string;
  description?: string;
  address: VenueAddress;
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

export type VenueProfile = Venue;

/** Fields owned by the physical venue, not its manager profile. */
export interface VenueProfileInput {
  name: string;
  type?: string;
  description?: string;
  address: VenueAddress;
  capacity: number;
  pricePerDay?: number;
  contactEmail?: string;
  contactPhone?: string;
}

export interface VenueCatalogResponse {
  data: VenueProfile[];
  total: number;
  page: number;
  limit: number;
}

export const VENUE_PROFILE_NOT_FOUND = "VENUE_PROFILE_NOT_FOUND";

/** Voir `isMissingProfileError` côté prestataire : même raison, même contrat. */
export function isMissingProfileError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}

export const venueProfileService = {
  async list(page = 1, limit = 20): Promise<VenueCatalogResponse> {
    const response = await api.get<VenueCatalogResponse>("/venues", {
      params: { page, limit },
    });
    return response.data;
  },

  async listMine(page = 1, limit = 20): Promise<VenueCatalogResponse> {
    const res = await api.get<VenueCatalogResponse>("/venues/mine", { params: { page, limit } });
    return res.data;
  },

  async getMine(id: string): Promise<Venue> {
    return (await api.get<Venue>(`/venues/mine/${encodeURIComponent(id)}`)).data;
  },

  async createProfile(input: VenueProfileInput): Promise<VenueProfile> {
    const res = await api.post<VenueProfile>("/venues", input);
    return res.data;
  },

  /** Ownership of the selected venue is verified by the API. */
  async updateProfile(id: string, input: Partial<VenueProfileInput>): Promise<VenueProfile> {
    const res = await api.put<VenueProfile>(`/venues/${encodeURIComponent(id)}`, input);
    return res.data;
  },
};

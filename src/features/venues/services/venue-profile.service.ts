import api, { ApiClientError } from "@/shared/lib/api";

export interface VenueAddress {
  street: string;
  city: string;
  province?: string;
  postalCode?: string;
}

export interface VenueProfile {
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

/** Champs éditables depuis l'écran « Ma fiche lieu ». */
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

  async getMyProfile(): Promise<VenueProfile> {
    const res = await api.get<VenueProfile>("/venues/me");
    return res.data;
  },

  async createProfile(input: VenueProfileInput): Promise<VenueProfile> {
    const res = await api.post<VenueProfile>("/venues", input);
    return res.data;
  },

  /** `PUT /venues/me` — identité serveur, aucun id transmis par le client. */
  async updateProfile(input: Partial<VenueProfileInput>): Promise<VenueProfile> {
    const res = await api.put<VenueProfile>("/venues/me", input);
    return res.data;
  },
};

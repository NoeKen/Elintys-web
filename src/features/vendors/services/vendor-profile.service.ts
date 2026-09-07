import api, { ApiClientError } from "@/shared/lib/api";
import type { VendorCategory } from "@/features/vendors/types";

export interface VendorProfile {
  _id: string;
  businessName: string;
  category: VendorCategory;
  description?: string;
  serviceArea?: string;
  photos: string[];
  rating: number;
  reviewCount: number;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}

/** Champs éditables depuis l'écran « Mon profil prestataire ». */
export interface VendorProfileInput {
  businessName: string;
  category: VendorCategory;
  description?: string;
  serviceArea?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/** Code métier renvoyé par l'API quand le compte n'a pas encore de profil. */
export const VENDOR_PROFILE_NOT_FOUND = "VENDOR_PROFILE_NOT_FOUND";

/**
 * Distingue « ce compte n'a pas encore de profil » d'une panne.
 *
 * Sans cette distinction, l'écran affichait un formulaire d'édition vide sur
 * un 404 comme sur une erreur réseau : l'utilisateur remplissait un formulaire
 * qui ne pouvait pas aboutir.
 */
export function isMissingProfileError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}

export const vendorProfileService = {
  async getMyProfile(): Promise<VendorProfile> {
    const res = await api.get<VendorProfile>("/vendors/me");
    return res.data;
  },

  /** Création du profil du compte connecté. L'identité vient du serveur. */
  async createProfile(input: VendorProfileInput): Promise<VendorProfile> {
    const res = await api.post<VendorProfile>("/vendors", input);
    return res.data;
  },

  /**
   * Mise à jour du profil du compte connecté.
   *
   * `PUT /vendors/me` — et non `PUT /vendors/:id` : le client ne transmet
   * jamais l'identifiant du profil comme autorité.
   */
  async updateProfile(input: Partial<VendorProfileInput>): Promise<VendorProfile> {
    const res = await api.put<VendorProfile>("/vendors/me", input);
    return res.data;
  },
};

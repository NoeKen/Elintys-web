export type VendorCategory =
  | "photographe"
  | "traiteur"
  | "decorateur"
  | "animateur"
  | "dj"
  | "sonorisation"
  | "autre";

export interface Vendor {
  _id: string;
  id?: string;
  businessName: string;
  category: VendorCategory;
  description?: string;
  photos: string[];
  priceRange?: { min?: number; max?: number; currency?: string };
  serviceArea: string;
  contactEmail?: string;
  contactPhone?: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorCatalogResponse {
  data: Vendor[];
  total: number;
  page: number;
  limit: number;
}

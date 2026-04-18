export type VendorCategory =
  | "catering"
  | "photography"
  | "music"
  | "decoration"
  | "venue"
  | "other";

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorInput {
  name: string;
  category: VendorCategory;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

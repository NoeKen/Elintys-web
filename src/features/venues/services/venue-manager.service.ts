import api from '@/shared/lib/api';
export interface VenueManagerInput {
  professionalName: string;
  description?: string;
  region?: string;
  contactEmail?: string;
  contactPhone?: string;
}
export interface VenueManagerProfile extends VenueManagerInput { _id: string }
export const venueManagerService = {
  async getMine(): Promise<VenueManagerProfile> {
    return (await api.get<VenueManagerProfile>('/venue-managers/me')).data;
  },
  async save(input: VenueManagerInput): Promise<VenueManagerProfile> {
    return (await api.put<VenueManagerProfile>('/venue-managers/me', input)).data;
  },
};

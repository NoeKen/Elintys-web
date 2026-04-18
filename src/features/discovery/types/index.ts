export interface PublicEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  coverImageUrl?: string;
  ticketPrice?: number;
  currency?: string;
}

export interface DiscoveryFilters {
  query?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  page?: number;
  perPage?: number;
}

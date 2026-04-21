import api from "@/shared/lib/api";
import type { PaginatedResponse } from "@/shared/types";
import type { PublicEvent, DiscoveryFilters } from "../types";

export const discoveryService = {
  async search(filters: DiscoveryFilters = {}): Promise<PaginatedResponse<PublicEvent>> {
    const res = await api.get<PaginatedResponse<PublicEvent>>("/discovery/events", {
      params: filters,
    });
    return res.data;
  },

  async getFeatured(): Promise<PublicEvent[]> {
    const res = await api.get<PublicEvent[]>("/discovery/featured");
    return res.data;
  },
};

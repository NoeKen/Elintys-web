import api from "@/shared/lib/api";
import type { DiscoveryPage, PublicEvent, DiscoveryFilters } from "../types";

export const discoveryService = {
  async search(filters: DiscoveryFilters = {}): Promise<DiscoveryPage<PublicEvent>> {
    const res = await api.get<DiscoveryPage<PublicEvent>>("/discovery/events", {
      params: filters,
    });
    return res.data;
  },

  async getFeatured(): Promise<PublicEvent[]> {
    const res = await api.get<PublicEvent[]>("/discovery/featured");
    return res.data;
  },
};

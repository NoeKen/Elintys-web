"use client";

import { useQuery } from "@tanstack/react-query";
import { discoveryService } from "../services/discovery.service";
import type { DiscoveryFilters } from "../types";

export function useDiscovery(filters: DiscoveryFilters = {}) {
  return useQuery({
    queryKey: ["discovery", filters],
    queryFn: () => discoveryService.search(filters),
  });
}

export function useFeaturedEvents() {
  return useQuery({
    queryKey: ["discovery", "featured"],
    queryFn: () => discoveryService.getFeatured(),
  });
}

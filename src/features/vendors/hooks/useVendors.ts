"use client";

import { useQuery } from "@tanstack/react-query";
import { vendorsService } from "../services/vendors.service";

export function useVendors(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ["vendors", page, perPage],
    queryFn: () => vendorsService.list(page, perPage),
  });
}

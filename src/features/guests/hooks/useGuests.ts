"use client";

import { useQuery } from "@tanstack/react-query";
import { guestsService } from "../services/guests.service";
import { useAuthToken } from "@/server/auth/use-auth-token";

export function useGuests(eventId: string, page = 1) {
  const token = useAuthToken();
  return useQuery({
    queryKey: ["guests", eventId, page],
    queryFn: () => guestsService.list(token, eventId, page),
    enabled: !!eventId && !!token,
  });
}

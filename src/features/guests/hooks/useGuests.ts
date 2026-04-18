"use client";

import { useQuery } from "@tanstack/react-query";
import { guestsService } from "../services/guests.service";

export function useGuests(eventId: string, page = 1, perPage = 50) {
  return useQuery({
    queryKey: ["guests", eventId, page, perPage],
    queryFn: () => guestsService.listByEvent(eventId, page, perPage),
    enabled: !!eventId,
  });
}

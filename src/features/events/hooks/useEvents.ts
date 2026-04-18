"use client";

import { useQuery } from "@tanstack/react-query";
import { eventsService } from "../services/events.service";

export function useEvents(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ["events", page, perPage],
    queryFn: () => eventsService.list(page, perPage),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => eventsService.get(id),
    enabled: !!id,
  });
}

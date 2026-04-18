"use client";

import { useQuery } from "@tanstack/react-query";
import { ticketsService } from "../services/tickets.service";

export function useTickets(eventId: string, page = 1, perPage = 50) {
  return useQuery({
    queryKey: ["tickets", eventId, page, perPage],
    queryFn: () => ticketsService.listByEvent(eventId, page, perPage),
    enabled: !!eventId,
  });
}

export function useTicketTypes(eventId: string) {
  return useQuery({
    queryKey: ["ticket-types", eventId],
    queryFn: () => ticketsService.getTypes(eventId),
    enabled: !!eventId,
  });
}

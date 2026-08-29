"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsService, type PurchaseFreeTicketOptions } from "../services/tickets.service";

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

export function usePurchaseFreeTicket(ticketTypeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      quantity,
      accessGrant,
      idempotencyKey,
    }: {
      quantity: number;
      accessGrant?: string;
      idempotencyKey: string;
    }) => {
      const options: PurchaseFreeTicketOptions = {
        idempotencyKey,
        accessGrant,
      };
      return ticketsService.purchaseFree(ticketTypeId, quantity, options);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventRegistrationService, type RegisterForEventOptions } from "../services/event-registration.service";

export function useMyEventRegistrations(page = 1, limit = 25, enabled = true) {
  return useQuery({
    queryKey: ["event-registrations", "me", page, limit],
    queryFn: () => eventRegistrationService.findMine(page, limit),
    staleTime: 30_000,
    enabled,
  });
}

export function useRegisterForEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accessGrant,
      idempotencyKey,
    }: {
      accessGrant?: string;
      idempotencyKey: string;
    }) => {
      const options: RegisterForEventOptions = {
        idempotencyKey,
        accessGrant,
      };
      return eventRegistrationService.register(eventId, options);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event-registrations"] });
    },
  });
}

export function useCancelEventRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) => eventRegistrationService.cancel(registrationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event-registrations"] });
    },
  });
}

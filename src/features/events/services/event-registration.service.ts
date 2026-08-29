import api from "@/shared/lib/api";
import type { EventRegistrationStatus, PaginatedEventRegistrations } from "../types";

export interface EventRegistrationResult {
  _id: string;
  eventId: string;
  status: EventRegistrationStatus;
}

export interface RegisterForEventOptions {
  idempotencyKey: string;
  accessGrant?: string;
}

export const eventRegistrationService = {
  async register(eventId: string, options: RegisterForEventOptions): Promise<EventRegistrationResult> {
    const res = await api.post<EventRegistrationResult>(
      "/event-registrations",
      { eventId },
      {
        headers: {
          "Idempotency-Key": options.idempotencyKey,
          ...(options.accessGrant ? { "X-Event-Access-Grant": options.accessGrant } : {}),
        },
      },
    );
    return res.data;
  },

  async cancel(registrationId: string): Promise<void> {
    await api.delete<void>(`/event-registrations/${registrationId}`);
  },

  async findMine(page = 1, limit = 25): Promise<PaginatedEventRegistrations> {
    const res = await api.get<PaginatedEventRegistrations>("/event-registrations/me", {
      params: { page, limit },
    });
    return res.data;
  },
};

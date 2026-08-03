import api from "@/shared/lib/api";
import type { PaginatedResponse } from "@/shared/types";
import type { Event, CreateEventInput, UpdateEventInput, EventAccessRequest, EventAccessRequestStatus } from "../types";

export interface EventPublishReadinessError {
  code: string;
  field: string;
}

export interface EventPublishReadiness {
  publishable: boolean;
  errors: EventPublishReadinessError[];
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeReadinessError(value: unknown): EventPublishReadinessError | null {
  if (typeof value === "string") {
    const code = value.trim();
    return code ? { code, field: "" } : null;
  }

  if (!isRecord(value)) return null;

  const rawCode = typeof value.code === "string" ? value.code : value.message;
  const code = typeof rawCode === "string" ? rawCode.trim() : "";
  if (!code) return null;

  return {
    code,
    field: typeof value.field === "string" ? value.field.trim() : "",
  };
}

export function normalizeEventPublishReadiness(payload: unknown): EventPublishReadiness {
  if (!isRecord(payload)) {
    return { publishable: false, errors: [], warnings: [] };
  }

  const errors = new Map<string, EventPublishReadinessError>();
  if (Array.isArray(payload.errors)) {
    payload.errors.forEach((value) => {
      const error = normalizeReadinessError(value);
      if (error) errors.set(`${error.code}:${error.field}`, error);
    });
  }

  const warnings = Array.isArray(payload.warnings)
    ? [...new Set(payload.warnings.filter((value): value is string => typeof value === "string"))]
    : [];

  return {
    publishable: payload.publishable === true,
    errors: [...errors.values()],
    warnings,
  };
}

export const eventsService = {
  async list(page = 1, perPage = 20): Promise<PaginatedResponse<Event>> {
    const res = await api.get<PaginatedResponse<Event>>("/events", { params: { page, perPage } });
    return res.data;
  },

  async get(id: string): Promise<Event> {
    const res = await api.get<Event>(`/events/${id}`);
    return res.data;
  },

  async create(data: CreateEventInput): Promise<Event> {
    const res = await api.post<Event>("/events", data);
    return res.data;
  },

  async update(id: string, data: UpdateEventInput): Promise<Event> {
    const res = await api.patch<Event>(`/events/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  async getBySlug(slug: string): Promise<Event> {
    const res = await api.get<Event>(`/events/slug/${slug}`);
    return res.data;
  },

  async getMyEvents(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Event>> {
    const res = await api.get<PaginatedResponse<Event>>('/events/my', { params });
    return res.data;
  },

  async getPublishReadiness(id: string): Promise<EventPublishReadiness> {
    const res = await api.get<unknown>(`/events/${id}/publish-readiness`);
    return normalizeEventPublishReadiness(res.data);
  },

  async listAccessRequests(id: string): Promise<EventAccessRequest[]> {
    const res = await api.get<EventAccessRequest[]>(`/events/${id}/access/requests`);
    return res.data;
  },

  async reviewAccessRequest(id: string, requestId: string, status: EventAccessRequestStatus): Promise<EventAccessRequest> {
    const res = await api.patch<EventAccessRequest>(`/events/${id}/access/requests/${requestId}`, { status });
    return res.data;
  },

  async publish(id: string): Promise<Event> {
    const res = await api.patch<Event>(`/events/${id}/publish`, {});
    return res.data;
  },
};

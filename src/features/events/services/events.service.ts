import api from "@/shared/lib/api";
import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
  EventAccessRequest,
  EventAccessRequestStatus,
  EventDiscoverability,
  EventAccessPolicy,
  AdmissionMode,
} from "../types";

/**
 * Payload du PUT /events/:id/access-configuration.
 * Le endpoint est un remplacement complet : les trois champs sont requis.
 * `accessPolicy.code` n'est envoyé que lorsqu'un nouveau code est saisi ;
 * omis, le serveur conserve le hash existant.
 */
export interface UpdateEventAccessConfigurationInput {
  discoverability: EventDiscoverability;
  accessPolicy: EventAccessPolicy;
  admissionModes: AdmissionMode[];
}

export interface EventPublishReadinessError {
  code: string;
  field: string;
}

export interface EventPublishReadiness {
  publishable: boolean;
  errors: EventPublishReadinessError[];
  warnings: string[];
}

export type OrganizerEventView = 'all' | 'draft' | 'ready' | 'published' | 'completed' | 'archived';
export type OrganizerEventSort = 'updated_desc' | 'date_asc' | 'title_asc';
export type OrganizerEventProgress = 'incomplete' | 'complete';
export type OrganizerEventDate = 'upcoming' | 'past' | 'undated';
export type OrganizerActionCode =
  | 'REVIEW_ACCESS_REQUESTS'
  | 'COMPLETE_INFORMATION'
  | 'COMPLETE_SCHEDULE'
  | 'ADD_VENUE'
  | 'ADD_COVER'
  | 'CONFIGURE_ACCESS'
  | 'CONFIGURE_TICKETS'
  | 'CONTINUE_CREATION'
  | 'PUBLISH_EVENT';

export interface OrganizerEvent extends Event {
  readiness: EventPublishReadiness;
  pendingAccessRequests: number;
}

export interface OrganizerEventsQuery {
  page?: number;
  limit?: number;
  view?: OrganizerEventView;
  status?: string;
  search?: string;
  eventType?: string;
  discoverability?: string;
  accessPolicy?: string;
  progress?: OrganizerEventProgress;
  date?: OrganizerEventDate;
  sort?: OrganizerEventSort;
}

export interface OrganizerEventsPage {
  data: OrganizerEvent[];
  total: number;
  page: number;
  limit: number;
  meta: { total: number; page: number; perPage: number; lastPage: number };
}

export interface OrganizerDashboardAction {
  code: OrganizerActionCode;
  priority: 'high' | 'medium' | 'low';
  event: OrganizerEvent;
  progress: number;
  requestCount?: number;
}

export interface OrganizerDashboardSummary {
  metrics: {
    totalEvents: number;
    activeEvents: number;
    upcomingEvents: number;
    draftEvents: number;
    pendingActions: number;
  };
  actions: OrganizerDashboardAction[];
  upcoming: OrganizerEvent[];
  activityAvailable: false;
}

interface OrganizerEventsPayload {
  data?: OrganizerEvent[];
  total?: number;
  page?: number;
  limit?: number;
  meta?: { total?: number; page?: number; perPage?: number; lastPage?: number };
}

export function normalizeOrganizerEventsPage(payload: OrganizerEventsPayload): OrganizerEventsPage {
  const data = Array.isArray(payload.data) ? payload.data : [];
  const total = payload.total ?? payload.meta?.total ?? data.length;
  const page = payload.page ?? payload.meta?.page ?? 1;
  const limit = payload.limit ?? payload.meta?.perPage ?? Math.max(data.length, 1);
  const lastPage = payload.meta?.lastPage ?? Math.max(1, Math.ceil(total / limit));
  return { data, total, page, limit, meta: { total, page, perPage: limit, lastPage } };
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
  async list(page = 1, perPage = 20): Promise<{ data: Event[]; meta: { total: number; page: number; perPage: number; lastPage: number } }> {
    const res = await api.get<OrganizerEventsPayload>("/events", { params: { page, limit: perPage } });
    return normalizeOrganizerEventsPage(res.data);
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

  async getMyEvents(params?: OrganizerEventsQuery): Promise<OrganizerEventsPage> {
    const res = await api.get<OrganizerEventsPayload>('/events/my', { params });
    return normalizeOrganizerEventsPage(res.data);
  },

  async getOrganizerSummary(): Promise<OrganizerDashboardSummary> {
    const res = await api.get<OrganizerDashboardSummary>('/events/my/summary');
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

  async updateAccessConfiguration(id: string, data: UpdateEventAccessConfigurationInput): Promise<Event> {
    const res = await api.put<Event>(`/events/${id}/access-configuration`, data);
    return res.data;
  },

  async publish(id: string): Promise<Event> {
    const res = await api.patch<Event>(`/events/${id}/publish`, {});
    return res.data;
  },

  async archive(id: string): Promise<Event> {
    const res = await api.patch<Event>(`/events/${id}/archive`, {});
    return res.data;
  },

  async restore(id: string): Promise<Event> {
    const res = await api.patch<Event>(`/events/${id}/restore`, {});
    return res.data;
  },
};

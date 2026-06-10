import api from "@/shared/lib/api";
import type { PaginatedResponse } from "@/shared/types";
import type { Event, CreateEventInput, UpdateEventInput } from "../types";

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
};

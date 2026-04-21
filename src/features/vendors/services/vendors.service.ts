import api from "@/shared/lib/api";
import type { PaginatedResponse } from "@/shared/types";
import type { Vendor, CreateVendorInput } from "../types";

export const vendorsService = {
  async list(page = 1, perPage = 20): Promise<PaginatedResponse<Vendor>> {
    const res = await api.get<PaginatedResponse<Vendor>>("/vendors", { params: { page, perPage } });
    return res.data;
  },

  async get(id: string): Promise<Vendor> {
    const res = await api.get<Vendor>(`/vendors/${id}`);
    return res.data;
  },

  async create(data: CreateVendorInput): Promise<Vendor> {
    const res = await api.post<Vendor>("/vendors", data);
    return res.data;
  },

  async update(id: string, data: Partial<CreateVendorInput>): Promise<Vendor> {
    const res = await api.patch<Vendor>(`/vendors/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },
};

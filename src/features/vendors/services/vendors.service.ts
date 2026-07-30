import api from "@/shared/lib/api";
import type { Vendor, CreateVendorInput, VendorCatalogResponse } from "../types";

export const vendorsService = {
  async list(page = 1, limit = 20): Promise<VendorCatalogResponse> {
    const res = await api.get<VendorCatalogResponse>("/vendors", { params: { page, limit } });
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

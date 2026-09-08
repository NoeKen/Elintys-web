import api from "@/shared/lib/api";
import type { VendorCatalogResponse } from "../types";

export const vendorsService = {
  async list(page = 1, limit = 20): Promise<VendorCatalogResponse> {
    const res = await api.get<VendorCatalogResponse>("/vendors", { params: { page, limit } });
    return res.data;
  },
};

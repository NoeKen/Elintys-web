import api from '@/shared/lib/api';

export type PurchaseStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface PurchaseOrder {
  _id: string;
  event: string;
  eventSummary: { title: string; slug: string } | null;
  status: PurchaseStatus;
  currency: string;
  totalAmount: number;
  createdAt: string;
  lines: Array<{ ticketTypeId: string; quantity: number; unitPrice: number; lineTotal: number }>;
  payment: { provider: string; status: string; checkoutUrl: string | null };
}

export interface PurchasePage {
  data: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
}

export const accountService = {
  async getPurchases(params: { page?: number; limit?: number } = {}): Promise<PurchasePage> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const response = await api.get<PurchasePage>('/ticket-orders/me', {
      params: { page, limit },
    });
    return response.data;
  },
};

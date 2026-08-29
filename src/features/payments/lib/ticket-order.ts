import api from '@/shared/lib/api';

/**
 * États de commande exposés par l'API. Le frontend ne les calcule jamais :
 * il les reçoit du serveur, seule autorité.
 */
export type TicketOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface TicketOrderView {
  _id: string;
  event: string;
  status: TicketOrderStatus;
  currency: string;
  totalAmount: number;
  expiresAt: string;
  payment: {
    provider: string;
    status: string;
    /** URL d'approbation du fournisseur. Aucune donnée sensible. */
    checkoutUrl: string | null;
  };
  admissionIds: string[];
  requiresManualReview: boolean;
  failureReason: string | null;
}

export interface CreateTicketOrderInput {
  lines: { ticketTypeId: string; quantity: number }[];
  idempotencyKey: string;
  accessGrant?: string;
}

export async function createTicketOrder(input: CreateTicketOrderInput): Promise<TicketOrderView> {
  const response = await api.post<TicketOrderView>(
    '/ticket-orders',
    { lines: input.lines },
    {
      headers: {
        'Idempotency-Key': input.idempotencyKey,
        ...(input.accessGrant ? { 'X-Event-Access-Grant': input.accessGrant } : {}),
      },
    },
  );
  return response.data;
}

export async function fetchTicketOrder(orderId: string): Promise<TicketOrderView> {
  const response = await api.get<TicketOrderView>(`/ticket-orders/${orderId}`);
  return response.data;
}

/**
 * Demande au SERVEUR de synchroniser l'issue du paiement auprès du fournisseur.
 *
 * Le retour du fournisseur dans le navigateur n'est jamais une preuve de
 * paiement : c'est cet appel qui fait foi.
 */
export async function syncTicketOrder(orderId: string): Promise<TicketOrderView> {
  const response = await api.post<TicketOrderView>(`/ticket-orders/${orderId}/sync-payment`, {});
  return response.data;
}

/** Vue d'affichage dérivée, indépendante des libellés. */
export type PaymentDisplayState =
  | 'checking'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'pending'
  | 'review'
  | 'networkError'
  | 'missingOrder';

export function toDisplayState(order: TicketOrderView | null): PaymentDisplayState {
  if (!order) return 'missingOrder';
  if (order.requiresManualReview) return 'review';
  switch (order.status) {
    case 'PAID':
      return 'paid';
    case 'FAILED':
      return 'failed';
    case 'EXPIRED':
      return 'expired';
    case 'CANCELLED':
      return 'cancelled';
    case 'PENDING_PAYMENT':
      return 'checking';
  }
}

/** Un état terminal arrête la synchronisation : plus rien ne changera. */
export function isTerminalDisplayState(state: PaymentDisplayState): boolean {
  return state === 'paid' || state === 'failed' || state === 'expired' || state === 'cancelled' || state === 'review';
}

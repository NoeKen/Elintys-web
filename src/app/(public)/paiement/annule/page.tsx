import { participationCopy } from '@/features/events/lib/participation-error';
import { PaymentStatusClient } from '@/features/payments/components/PaymentStatusClient';

const copy = participationCopy.payment;

export const metadata = {
  title: copy.cancelTitle,
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readOrderId(params: Record<string, string | string[] | undefined>): string | null {
  const raw = params.order_id;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value) ? value : null;
}

/**
 * Retour « annulation » du fournisseur de paiement.
 *
 * Quitter la fenêtre du fournisseur ne prouve PAS qu'aucun montant n'a été
 * capturé. Aucun message absolu du type « aucun montant n'a été débité »
 * n'est affiché : l'état réel est demandé au serveur.
 */
export default async function PaymentCancelledPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="public-detail-shell mesh-gradient">
      <section className="container-public">
        <PaymentStatusClient
          orderId={readOrderId(params)}
          introTitle={copy.cancelTitle}
          introDescription={copy.cancelDescription}
        />
      </section>
    </div>
  );
}

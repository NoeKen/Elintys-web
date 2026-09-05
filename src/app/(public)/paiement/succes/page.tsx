import { participationCopy } from '@/features/events/lib/participation-error';
import { PaymentStatusClient } from '@/features/payments/components/PaymentStatusClient';

const copy = participationCopy.payment;

export const metadata = {
  title: copy.statusTitle,
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readOrderId(params: Record<string, string | string[] | undefined>): string | null {
  const raw = params.order_id;
  const value = Array.isArray(raw) ? raw[0] : raw;
  // Seul un ObjectId Mongo est accepté : l'URL de retour ne doit pas pouvoir
  // servir de vecteur d'injection vers une ressource arbitraire.
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value) ? value : null;
}

/**
 * Retour du fournisseur de paiement.
 *
 * IMPORTANT : atterrir sur cette page ne prouve RIEN. L'état affiché provient
 * exclusivement du serveur, qui interroge lui-même le fournisseur.
 */
export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="public-detail-shell mesh-gradient">
      <section className="container-public">
        <PaymentStatusClient orderId={readOrderId(params)} introTitle={copy.statusTitle} />
      </section>
    </div>
  );
}

import Link from 'next/link';

interface PaymentSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export const metadata = {
  title: 'Paiement confirmé',
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div className="public-detail-shell mesh-gradient">
      <section className="container-public">
        <div className="glass-card mx-auto max-w-2xl p-7 text-center sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-pale">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-teal"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="premium-heading">Paiement confirmé</h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
            Votre paiement a été traité avec succès. Vos billets sont disponibles dans votre espace.
          </p>

          {sessionId && (
            <p className="mt-3 break-all text-sm text-on-surface-variant">
              Référence de session : <span className="font-mono text-navy">{sessionId}</span>
            </p>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/billetterie" className="premium-button">
              Voir mes billets
            </Link>
            <Link href="/evenements" className="premium-button-secondary">
              Découvrir d&apos;autres événements
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

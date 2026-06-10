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
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-12">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-pale">
        <svg
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

      <h1 className="font-serif text-3xl font-bold text-navy">Paiement confirmé</h1>

      <p className="mt-4 max-w-2xl text-base text-muted">
        Votre paiement a été traité avec succès. Vos billets sont disponibles dans votre espace.
      </p>

      {sessionId && (
        <p className="mt-3 text-sm text-muted">
          Référence de session : <span className="font-mono text-navy">{sessionId}</span>
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/billetterie"
          className="inline-flex items-center justify-center rounded-lg bg-teal px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          Voir mes billets
        </Link>
        <Link
          href="/evenements"
          className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 font-medium text-navy transition-colors hover:bg-surface"
        >
          Découvrir d&apos;autres événements
        </Link>
      </div>
    </div>
  );
}

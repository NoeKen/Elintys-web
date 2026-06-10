import Link from 'next/link';

export const metadata = {
  title: 'Paiement annulé',
};

export default function PaymentCancelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-12">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-pale">
        <svg
          aria-hidden="true"
          className="h-8 w-8 text-amber"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <h1 className="font-serif text-3xl font-bold text-navy">Paiement annulé</h1>

      <p className="mt-4 max-w-2xl text-base text-muted">
        Votre paiement a été annulé. Aucun montant n&apos;a été débité.
      </p>

      <p className="mt-3 text-sm text-muted">
        Vous pouvez réessayer votre paiement à tout moment.
      </p>

      <div className="mt-8">
        <Link
          href="/evenements"
          className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          Retour aux événements
        </Link>
      </div>
    </div>
  );
}

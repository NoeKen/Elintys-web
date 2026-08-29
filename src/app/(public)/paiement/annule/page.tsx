import Link from 'next/link';
import { participationCopy as copy } from '@/features/events/lib/participation-error';

export const metadata = {
  title: copy.paidUnavailableTitle,
};

export default function PaymentCancelPage() {
  return (
    <div className="public-detail-shell mesh-gradient">
      <section className="container-public">
        <div className="glass-card mx-auto max-w-2xl p-7 text-center sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold-pale">
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

          <p className="section-eyebrow">{copy.paidUnavailableBadge}</p>
          <h1 className="premium-heading mt-3">{copy.paidUnavailableTitle}</h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
            {copy.paidUnavailableDescription}
          </p>

          <div className="mt-8">
            <Link href="/evenements" className="premium-button">
              {copy.discoverEvents}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

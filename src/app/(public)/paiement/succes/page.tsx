import Link from 'next/link';
import { participationCopy as copy } from '@/features/events/lib/participation-error';

export const metadata = {
  title: copy.paidUnavailableTitle,
};

export default function PaymentSuccessPage() {
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

          <p className="section-eyebrow">{copy.paidUnavailableBadge}</p>
          <h1 className="premium-heading mt-3">{copy.paidUnavailableTitle}</h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
            {copy.paidUnavailableDescription}
          </p>

          <div className="mt-8 flex justify-center">
            <Link href="/evenements" className="premium-button-secondary">
              {copy.discoverEvents}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

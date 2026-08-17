'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { publicEventCopy as copy } from '@/features/events/i18n/public-event.copy';

export default function PublicEventError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-public flex min-h-[62dvh] items-center justify-center py-20 text-center" aria-labelledby="public-event-error-title">
      <div className="premium-card max-w-xl p-8 sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-pale text-terracotta-dark" aria-hidden="true"><AlertTriangle /></span>
        <h1 id="public-event-error-title" className="mt-6 font-serif text-4xl text-navy-dark">{copy.errorTitle}</h1>
        <p className="mt-4 leading-7 text-on-surface-variant">{copy.errorDescription}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="premium-button min-h-12 px-6"><RotateCcw size={16} aria-hidden="true" />{copy.retry}</button>
          <Link href="/evenements" className="premium-button-secondary min-h-12 px-6">{copy.backToEvents}</Link>
        </div>
      </div>
    </section>
  );
}

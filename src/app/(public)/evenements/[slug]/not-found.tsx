import Link from 'next/link';
import { CalendarX2 } from 'lucide-react';
import { publicEventCopy as copy } from '@/features/events/i18n/public-event.copy';

export default function PublicEventNotFound() {
  return (
    <section className="container-public flex min-h-[62dvh] items-center justify-center py-20 text-center" aria-labelledby="public-event-not-found-title">
      <div className="premium-card max-w-xl p-8 sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-pale text-teal-dark" aria-hidden="true"><CalendarX2 /></span>
        <h1 id="public-event-not-found-title" className="mt-6 font-serif text-4xl text-navy-dark">{copy.notFoundTitle}</h1>
        <p className="mt-4 leading-7 text-on-surface-variant">{copy.notFoundDescription}</p>
        <Link href="/evenements" className="premium-button mt-7 min-h-12 px-6">{copy.backToEvents}</Link>
      </div>
    </section>
  );
}

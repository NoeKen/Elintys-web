import Link from 'next/link';
import { EventCard, type EventCardData } from '@/components/events/EventCard';
import { VendorCard, type PublicVendor } from '@/components/public/VendorCard';
import { VenueCard, type PublicVenue } from '@/components/public/VenueCard';
import { CatalogErrorState } from '@/components/public/CatalogErrorState';
import { Search } from 'lucide-react';
import { buildDiscoveryHref, type DiscoveryQuery } from './discovery-query';
import type { MediaImageSource } from '@/shared/types/media.types';
import messages from '../../../messages/fr.json';

const copy = messages.publicSearch;

export interface RawDiscoveryEvent {
  _id: string;
  title: string;
  slug?: string;
  startDate?: string;
  location?: { city?: string };
  coverImage?: MediaImageSource;
  eventType?: string;
  status?: string;
}

export interface DiscoveryResultData {
  events: RawDiscoveryEvent[];
  vendors: PublicVendor[];
  venues: PublicVenue[];
  totals: { events: number; vendors: number; venues: number };
}

function normalizeEvent(event: RawDiscoveryEvent): EventCardData {
  return {
    _id: event._id,
    title: event.title,
    slug: event.slug ?? event._id,
    startDate: event.startDate ?? new Date(0).toISOString(),
    locationCity: event.location?.city ?? copy.online,
    coverImage: event.coverImage,
    eventType: event.eventType ?? copy.eventFallback,
    status: event.status ?? 'published',
  };
}

function Pagination({ query, total }: { query: DiscoveryQuery; total: number }) {
  const pages = Math.max(1, Math.ceil(total / 12));
  if (pages <= 1) return null;
  return (
    <nav aria-label={copy.pagination} className="mt-10 flex items-center justify-center gap-4">
      {query.page > 1 ? (
        <Link className="btn-secondary min-h-11" href={buildDiscoveryHref(query, { page: query.page - 1 })}>{copy.previous}</Link>
      ) : <span />}
      <span className="text-sm text-on-surface-variant">{copy.page.replace('{page}', String(query.page)).replace('{total}', String(pages))}</span>
      {query.page < pages ? (
        <Link className="btn-secondary min-h-11" href={buildDiscoveryHref(query, { page: query.page + 1 })}>{copy.next}</Link>
      ) : <span />}
    </nav>
  );
}

export function DiscoveryResults({
  query,
  result,
  hasError,
  retryHref,
}: {
  query: DiscoveryQuery;
  result: DiscoveryResultData;
  hasError: boolean;
  retryHref: string;
}) {
  if (hasError) return <CatalogErrorState message={copy.errorDescription} retryHref={retryHref} />;

  const total = result.totals.events + result.totals.vendors + result.totals.venues;
  const visibleCount = result.events.length + result.vendors.length + result.venues.length;
  if (visibleCount === 0) {
    return (
      <div className="empty-state glass-card" data-testid="search-empty-state">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-pale text-teal">
          <Search className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-2xl text-on-surface">{copy.noResults}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{copy.noResultsDescription}</p>
        <Link href="/evenements/recherche" className="btn-secondary mt-5 min-h-11">{copy.clearAll}</Link>
      </div>
    );
  }

  const section = (id: string, title: string, count: number, visible: number, children: React.ReactNode) => visible > 0 && (
    <section className="mt-10" aria-labelledby={id}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id={id} className="font-serif text-3xl text-on-surface">{title}</h2>
        <span className="text-sm font-semibold text-on-surface-variant">{count}</span>
      </div>
      <div className="featured-grid">{children}</div>
    </section>
  );

  const paginationTotal = query.type === 'event'
    ? result.totals.events
    : query.type === 'vendor'
      ? result.totals.vendors
      : query.type === 'venue'
        ? result.totals.venues
        : Math.max(result.totals.events, result.totals.vendors, result.totals.venues);

  return (
    <div>
      <p className="sr-only" aria-live="polite">{total === 1 ? copy.resultCountOne : copy.resultCount.replace('{count}', String(total))}</p>
      {section('search-event-results', copy.events, result.totals.events, result.events.length, result.events.map((event) => <EventCard key={event._id} event={normalizeEvent(event)} />))}
      {section('search-vendor-results', copy.vendors, result.totals.vendors, result.vendors.length, result.vendors.map((vendor) => <VendorCard key={vendor._id} vendor={vendor} />))}
      {section('search-venue-results', copy.venues, result.totals.venues, result.venues.length, result.venues.map((venue) => <VenueCard key={venue._id} venue={venue} />))}
      <Pagination query={query} total={paginationTotal} />
    </div>
  );
}

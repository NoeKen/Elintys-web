import type { Metadata } from 'next';
import { SearchBar } from '@/components/public/SearchBar';
import { DiscoveryFilters } from '@/features/discovery/DiscoveryFilters';
import { DiscoveryResults, type DiscoveryResultData, type RawDiscoveryEvent } from '@/features/discovery/DiscoveryResults';
import { buildDiscoveryApiPath, buildDiscoveryHref, parseDiscoveryQuery, type DiscoverySearchParams } from '@/features/discovery/discovery-query';
import type { PublicVendor } from '@/components/public/VendorCard';
import type { PublicVenue } from '@/components/public/VenueCard';
import { fetchCatalogJson } from '@/server/catalog/catalog-api';
import messages from '../../../../../messages/fr.json';

const copy = messages.publicSearch;

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: { canonical: '/evenements/recherche' },
  robots: { index: false, follow: true },
};

export const revalidate = 30;

interface AggregatedResponse extends DiscoveryResultData { page: number; limit: number }
interface TypedResponse<T> { data: T[]; total: number; page: number; limit: number }

const EMPTY: DiscoveryResultData = {
  events: [], vendors: [], venues: [], totals: { events: 0, vendors: 0, venues: 0 },
};

async function loadResults(query: ReturnType<typeof parseDiscoveryQuery>) {
  const apiPath = buildDiscoveryApiPath(query);
  if (!apiPath) {
    const featured = await fetchCatalogJson<RawDiscoveryEvent[]>('/discovery/featured?limit=6', { revalidate: 60 });
    const events = featured.data ?? [];
    return { result: { ...EMPTY, events, totals: { ...EMPTY.totals, events: events.length } }, error: featured.error };
  }
  if (query.type === 'all') {
    const response = await fetchCatalogJson<AggregatedResponse>(apiPath, { revalidate: 30 });
    return { result: response.data ?? EMPTY, error: response.error };
  }
  if (query.type === 'event') {
    const response = await fetchCatalogJson<TypedResponse<RawDiscoveryEvent>>(apiPath, { revalidate: 30 });
    const data = response.data;
    return { result: data ? { ...EMPTY, events: data.data, totals: { ...EMPTY.totals, events: data.total } } : EMPTY, error: response.error };
  }
  if (query.type === 'vendor') {
    const response = await fetchCatalogJson<TypedResponse<PublicVendor>>(apiPath, { revalidate: 30 });
    const data = response.data;
    return { result: data ? { ...EMPTY, vendors: data.data, totals: { ...EMPTY.totals, vendors: data.total } } : EMPTY, error: response.error };
  }
  const response = await fetchCatalogJson<TypedResponse<PublicVenue>>(apiPath, { revalidate: 30 });
  const data = response.data;
  return { result: data ? { ...EMPTY, venues: data.data, totals: { ...EMPTY.totals, venues: data.total } } : EMPTY, error: response.error };
}

export default async function PublicSearchPage({ searchParams }: { searchParams: Promise<DiscoverySearchParams> }) {
  const query = parseDiscoveryQuery(await searchParams);
  const { result, error } = await loadResults(query);
  const retryHref = buildDiscoveryHref(query, { page: query.page });
  const discoveryMode = query.type === 'all' && !query.q;

  return (
    <main className="min-h-screen bg-background pb-20 pt-28 sm:pt-32" data-testid="public-search-page">
      <div className="container-public">
        <header className="mx-auto max-w-3xl text-center">
          <span className="section-eyebrow">{copy.eyebrow}</span>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-on-surface sm:text-5xl lg:text-6xl">{copy.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-on-surface-variant sm:text-lg">{copy.description}</p>
        </header>
        <div className="mx-auto mt-8 max-w-4xl">
          <SearchBar defaultQuery={query.q} defaultType={query.type} showClear />
        </div>
        <div className="mt-8"><DiscoveryFilters query={query} /></div>
        <div className="mt-8">
          {discoveryMode && !error && (
            <div className="mb-2">
              <span className="section-eyebrow">{copy.suggestionsEyebrow}</span>
              <h2 className="mt-2 font-serif text-3xl text-on-surface">{copy.suggestionsTitle}</h2>
            </div>
          )}
          <DiscoveryResults query={query} result={result} hasError={error} retryHref={retryHref} />
        </div>
      </div>
    </main>
  );
}

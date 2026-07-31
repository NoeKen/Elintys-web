import type { Metadata } from 'next';
import { SearchBar } from '@/components/public/SearchBar';
import { LieuxContent } from '@/components/public/LieuxContent';
import type { PublicVenue } from '@/components/public/VenueCard';
import { buildCatalogQuery } from '@/features/catalog/catalog-filters';
import { fetchCatalogJson } from '@/server/catalog/catalog-api';

export const metadata: Metadata = {
  title: "Lieux d'exception à Montréal",
  description:
    "Salles de conférence, espaces de réception, studios et rooftops — les lieux d'exception pour vos événements.",
};

export const revalidate = 60;

interface VenuesResponse {
  data?: PublicVenue[];
  items?: PublicVenue[];
  total?: number;
}

export default async function LieuxPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string; capacity?: string; page?: string }>;
}) {
  const { type, city, capacity, page } = await searchParams;

  const query = buildCatalogQuery({ type, city, capacity, page });
  const result = await fetchCatalogJson<VenuesResponse>(`/venues?${query.toString()}`);
  const venues = result.data?.data ?? result.data?.items ?? [];
  const total = result.data?.total ?? venues.length;

  return (
    <>
      <section className="catalog-hero">
        <div className="container-public">
          <span className="section-eyebrow">Lieux d&apos;exception</span>
          <h1>Trouver un espace</h1>
          <p>
            Salles de conférence, espaces de réception, studios — tous vérifiés pour vos événements
            à Montréal.
          </p>
          <SearchBar defaultQuery={type} />
        </div>
      </section>

      <LieuxContent
        venues={venues}
        total={total}
        initialType={type ?? ''}
        initialCity={city ?? ''}
        initialCapacity={capacity ?? ''}
        hasError={result.error}
      />
    </>
  );
}

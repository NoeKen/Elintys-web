import type { Metadata } from 'next';
import { SearchBar } from '@/components/public/SearchBar';
import { LieuxContent } from '@/components/public/LieuxContent';
import type { PublicVenue } from '@/components/public/VenueCard';

export const metadata: Metadata = {
  title: "Lieux d'exception à Montréal",
  description:
    "Salles de conférence, espaces de réception, studios et rooftops — les lieux d'exception pour vos événements.",
};

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

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

  const qs = new URLSearchParams({
    page: page ?? '1',
    limit: '12',
    ...(city ? { city } : {}),
    ...(capacity ? { capacity } : {}),
  });

  let venues: PublicVenue[] = [];
  let total = 0;

  try {
    const res = await fetch(`${API_URL}/venues?${qs.toString()}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = (await res.json()) as VenuesResponse;
      venues = data.data ?? data.items ?? [];
      total = data.total ?? venues.length;
    }
  } catch {
    /* show empty state on error */
  }

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
      />
    </>
  );
}

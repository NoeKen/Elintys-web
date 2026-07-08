import type { Metadata } from 'next';
import { SearchBar } from '@/components/public/SearchBar';
import { PrestatairesContent } from '@/components/public/PrestatairesContent';
import type { PublicVendor } from '@/components/public/VendorCard';

export const metadata: Metadata = {
  title: 'Prestataires événementiels à Montréal',
  description:
    'Photographes, traiteurs, DJ, décorateurs — tous vérifiés pour vos événements québécois.',
};

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface VendorsResponse {
  data?: PublicVendor[];
  items?: PublicVendor[];
  total?: number;
}

export default async function PrestatairesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; page?: string }>;
}) {
  const { category, city, page } = await searchParams;

  const qs = new URLSearchParams({
    page: page ?? '1',
    limit: '12',
    ...(category ? { category } : {}),
    ...(city ? { city } : {}),
  });

  let vendors: PublicVendor[] = [];
  let total = 0;

  try {
    const res = await fetch(`${API_URL}/vendors?${qs.toString()}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = (await res.json()) as VendorsResponse;
      vendors = data.data ?? data.items ?? [];
      total = data.total ?? vendors.length;
    }
  } catch {
    /* show empty state on error */
  }

  return (
    <>
      <section style={{ background: 'var(--surface-low)', padding: '56px 0 48px' }}>
        <div className="container-public">
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(30px, 5vw, 48px)',
              color: 'var(--on-surface)',
              marginBottom: 10,
            }}
          >
            Trouver un prestataire
          </h1>
          <p
            style={{
              color: 'var(--on-surface-variant)',
              fontSize: 16,
              marginBottom: 28,
              maxWidth: 500,
            }}
          >
            Photographes, traiteurs, DJ, décorateurs — tous vérifiés pour vos événements québécois.
          </p>
          <SearchBar defaultQuery={category} />
        </div>
      </section>

      <PrestatairesContent
        vendors={vendors}
        total={total}
        initialCategory={category ?? ''}
        initialCity={city ?? ''}
      />
    </>
  );
}

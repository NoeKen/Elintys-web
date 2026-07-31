import type { Metadata } from 'next';
import { SearchBar } from '@/components/public/SearchBar';
import { PrestatairesContent } from '@/components/public/PrestatairesContent';
import type { PublicVendor } from '@/components/public/VendorCard';
import { buildCatalogQuery } from '@/features/catalog/catalog-filters';
import { fetchCatalogJson } from '@/server/catalog/catalog-api';

export const metadata: Metadata = {
  title: 'Prestataires événementiels à Montréal',
  description:
    'Photographes, traiteurs, DJ, décorateurs — tous vérifiés pour vos événements québécois.',
};

export const revalidate = 60;

interface VendorsResponse {
  data?: PublicVendor[];
  items?: PublicVendor[];
  total?: number;
}

export default async function PrestatairesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; price?: string; page?: string }>;
}) {
  const { category, city, price, page } = await searchParams;

  const query = buildCatalogQuery({ category, city, price, page });
  const result = await fetchCatalogJson<VendorsResponse>(
    `/vendors?${query.toString()}`,
  );
  const vendors = result.data?.data ?? result.data?.items ?? [];
  const total = result.data?.total ?? vendors.length;

  return (
    <>
      <section className="catalog-hero">
        <div className="container-public">
          <span className="section-eyebrow">Prestataires vérifiés</span>
          <h1>Trouver un prestataire</h1>
          <p>
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
        initialPrice={price ?? ''}
        hasError={result.error}
      />
    </>
  );
}

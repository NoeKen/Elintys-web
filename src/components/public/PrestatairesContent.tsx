'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VendorCard, type PublicVendor } from './VendorCard';
import { FilterSection } from './FilterSection';
import { EmptyState } from './EmptyState';
import { CatalogErrorState } from './CatalogErrorState';
import {
  CITIES,
  PRICE_RANGES,
  VENDOR_CATEGORIES,
} from '@/features/catalog/catalog-filters';

interface PrestatairesContentProps {
  vendors: PublicVendor[];
  total: number;
  initialCategory?: string;
  initialCity?: string;
  initialPrice?: string;
  hasError?: boolean;
}

export function PrestatairesContent({
  vendors,
  total,
  initialCategory = '',
  initialCity = '',
  initialPrice = '',
  hasError = false,
}: PrestatairesContentProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [price, setPrice] = useState(initialPrice);

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (city) p.set('city', city);
    if (price) p.set('price', price);
    router.push(`/prestataires${p.size ? `?${p.toString()}` : ''}`);
  };

  const resetFilters = () => {
    setCategory('');
    setCity('');
    setPrice('');
    router.push('/prestataires');
  };

  return (
    <div className="catalog-layout container-public">
      <aside className="catalog-filters">
        <div className="filter-header">
          <h3 className="text-base font-bold text-on-surface">Filtres</h3>
          <button type="button" className="filter-reset" onClick={resetFilters}>
            Réinitialiser
          </button>
        </div>

        <FilterSection title="CATÉGORIE">
          {VENDOR_CATEGORIES.map((option) => (
            <label key={option.value} className="filter-checkbox">
              <input
                type="checkbox"
                checked={category === option.value}
                onChange={(e) => setCategory(e.target.checked ? option.value : '')}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title="ZONE">
          <select
            className="filter-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Filtrer par zone"
          >
            <option value="">Toutes les zones</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FilterSection>

        <FilterSection title="GAMME DE PRIX">
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((p) => (
              <button
                type="button"
                key={p}
                className={`price-chip${price === p ? ' active' : ''}`}
                onClick={() => setPrice(price === p ? '' : p)}
              >
                {p}
              </button>
            ))}
          </div>
        </FilterSection>

        <button type="button" className="btn-primary-full" onClick={applyFilters}>
          Appliquer
        </button>
      </aside>

      <main>
        <div className="mb-6 flex items-baseline justify-between">
          <p className="rounded-full border border-outline-variant/70 bg-white/70 px-4 py-2 text-sm font-medium text-on-surface-variant shadow-[var(--shadow-soft-line)] backdrop-blur-md">
            {total} prestataire{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
          </p>
        </div>

        {hasError ? (
          <CatalogErrorState retryHref="/prestataires" />
        ) : vendors.length > 0 ? (
          <div className="vendors-grid">
            {vendors.map((vendor) => (
              <VendorCard key={vendor._id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <EmptyState
            message="Aucun prestataire ne correspond à vos critères."
            onReset={resetFilters}
          />
        )}
      </main>
    </div>
  );
}

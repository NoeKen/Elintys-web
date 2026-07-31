'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VenueCard, type PublicVenue } from './VenueCard';
import { FilterSection } from './FilterSection';
import { EmptyState } from './EmptyState';
import { CatalogErrorState } from './CatalogErrorState';
import {
  CITIES,
  MINIMUM_CAPACITIES,
  VENUE_TYPES,
} from '@/features/catalog/catalog-filters';

interface LieuxContentProps {
  venues: PublicVenue[];
  total: number;
  initialType?: string;
  initialCity?: string;
  initialCapacity?: string;
  hasError?: boolean;
}

export function LieuxContent({
  venues,
  total,
  initialType = '',
  initialCity = '',
  initialCapacity = '',
  hasError = false,
}: LieuxContentProps) {
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [city, setCity] = useState(initialCity);
  const [capacity, setCapacity] = useState(initialCapacity);

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (type) p.set('type', type);
    if (city) p.set('city', city);
    if (capacity) p.set('capacity', capacity);
    router.push(`/lieux${p.size ? `?${p.toString()}` : ''}`);
  };

  const resetFilters = () => {
    setType('');
    setCity('');
    setCapacity('');
    router.push('/lieux');
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

        <FilterSection title="TYPE D'ESPACE">
          {VENUE_TYPES.map((option) => (
            <label key={option.value} className="filter-checkbox">
              <input
                type="checkbox"
                checked={type === option.value}
                onChange={(e) => setType(e.target.checked ? option.value : '')}
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

        <FilterSection title="CAPACITÉ">
          <div className="flex flex-col gap-1.5">
            {MINIMUM_CAPACITIES.map((cap) => (
              <label key={cap.value} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={capacity === cap.value}
                  onChange={(e) => setCapacity(e.target.checked ? cap.value : '')}
                />
                <span>{cap.label}</span>
              </label>
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
            {total} lieu{total !== 1 ? 'x' : ''} trouvé{total !== 1 ? 's' : ''}
          </p>
        </div>

        {hasError ? (
          <CatalogErrorState retryHref="/lieux" />
        ) : venues.length > 0 ? (
          <div className="venues-grid">
            {venues.map((venue) => (
              <VenueCard key={venue._id} venue={venue} />
            ))}
          </div>
        ) : (
          <EmptyState
            message="Aucun lieu ne correspond à vos critères."
            onReset={resetFilters}
          />
        )}
      </main>
    </div>
  );
}

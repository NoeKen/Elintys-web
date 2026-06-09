'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VenueCard, type PublicVenue } from './VenueCard';
import { FilterSection } from './FilterSection';
import { EmptyState } from './EmptyState';

const VENUE_TYPES = [
  'Salle de conférence',
  'Espace de réception',
  'Studio',
  'Restaurant privatif',
  'Rooftop',
  'Salle de spectacle',
] as const;

const CITIES = ['Grand Montréal', 'Québec', 'Laval', 'Rive-Sud', 'Longueuil'] as const;

const CAPACITIES = [
  { label: 'Moins de 50', value: '50' },
  { label: '50 — 200', value: '200' },
  { label: '200 — 500', value: '500' },
  { label: 'Plus de 500', value: '1000' },
] as const;

interface LieuxContentProps {
  venues: PublicVenue[];
  total: number;
  initialType?: string;
  initialCity?: string;
}

export function LieuxContent({
  venues,
  total,
  initialType = '',
  initialCity = '',
}: LieuxContentProps) {
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [city, setCity] = useState(initialCity);
  const [capacity, setCapacity] = useState('');

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (type) p.set('type', type);
    if (city) p.set('city', city);
    if (capacity) p.set('capacity', capacity);
    router.push(`/lieux?${p.toString()}`);
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
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>Filtres</h3>
          <button className="filter-reset" onClick={resetFilters}>
            Réinitialiser
          </button>
        </div>

        <FilterSection title="TYPE D'ESPACE">
          {VENUE_TYPES.map((t) => (
            <label key={t} className="filter-checkbox">
              <input
                type="checkbox"
                checked={type === t}
                onChange={(e) => setType(e.target.checked ? t : '')}
              />
              <span>{t}</span>
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
              <option key={c}>{c}</option>
            ))}
          </select>
        </FilterSection>

        <FilterSection title="CAPACITÉ">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CAPACITIES.map((cap) => (
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

        <button className="btn-primary-full" onClick={applyFilters}>
          Appliquer
        </button>
      </aside>

      <main>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {total} lieu{total !== 1 ? 'x' : ''} trouvé{total !== 1 ? 's' : ''}
          </p>
        </div>

        {venues.length > 0 ? (
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VendorCard, type PublicVendor } from './VendorCard';
import { FilterSection } from './FilterSection';
import { EmptyState } from './EmptyState';

const CATEGORIES = [
  'Photographie',
  'Traiteur',
  'Musique & DJ',
  'Décoration',
  'Animation',
  'Sonorisation',
] as const;

const CITIES = ['Grand Montréal', 'Québec', 'Laval', 'Rive-Sud', 'Longueuil'] as const;
const PRICE_CHIPS = ['$', '$$', '$$$', '$$$$'] as const;

interface PrestatairesContentProps {
  vendors: PublicVendor[];
  total: number;
  initialCategory?: string;
  initialCity?: string;
}

export function PrestatairesContent({
  vendors,
  total,
  initialCategory = '',
  initialCity = '',
}: PrestatairesContentProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [price, setPrice] = useState('');

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (city) p.set('city', city);
    router.push(`/prestataires?${p.toString()}`);
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
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>Filtres</h3>
          <button className="filter-reset" onClick={resetFilters}>
            Réinitialiser
          </button>
        </div>

        <FilterSection title="CATÉGORIE">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="filter-checkbox">
              <input
                type="checkbox"
                checked={category === cat}
                onChange={(e) => setCategory(e.target.checked ? cat : '')}
              />
              <span>{cat}</span>
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

        <FilterSection title="GAMME DE PRIX">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRICE_CHIPS.map((p) => (
              <button
                key={p}
                className={`price-chip${price === p ? ' active' : ''}`}
                onClick={() => setPrice(price === p ? '' : p)}
              >
                {p}
              </button>
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
            {total} prestataire{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
          </p>
        </div>

        {vendors.length > 0 ? (
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

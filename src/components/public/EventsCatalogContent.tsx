'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventCard, type EventCardData } from '@/components/events/EventCard';
import { CatalogErrorState } from './CatalogErrorState';
import { EmptyState } from './EmptyState';
import { CITIES, EVENT_CATEGORIES } from '@/features/catalog/catalog-filters';

interface EventsCatalogContentProps {
  events: EventCardData[];
  total: number;
  hasError: boolean;
  initialCategory?: string;
  initialCity?: string;
}

export function EventsCatalogContent({
  events,
  total,
  hasError,
  initialCategory = '',
  initialCity = '',
}: EventsCatalogContentProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);

  const applyFilters = () => {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (city) query.set('city', city);
    router.push(`/evenements${query.size ? `?${query.toString()}` : ''}`);
  };

  const resetFilters = () => {
    setCategory('');
    setCity('');
    router.push('/evenements');
  };

  return (
    <section className="cinematic-section" aria-labelledby="events-catalog-title">
      <div className="container-public">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Catalogue</span>
            <h2 id="events-catalog-title" className="section-title">
              Tous les événements
            </h2>
          </div>
          {!hasError && (
            <p className="rounded-full border border-outline-variant/70 bg-white/70 px-4 py-2 text-sm font-medium text-on-surface-variant">
              {total} événement{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="catalog-toolbar">
          <select
            className="filter-select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filtrer les événements par catégorie"
          >
            <option value="">Toutes les catégories</option>
            {EVENT_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="Filtrer les événements par ville"
          >
            <option value="">Toutes les villes</option>
            {CITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button type="button" className="premium-button" onClick={applyFilters}>
            Appliquer
          </button>
          {(initialCategory || initialCity) && (
            <button type="button" className="filter-reset" onClick={resetFilters}>
              Réinitialiser
            </button>
          )}
        </div>

        {hasError ? (
          <CatalogErrorState retryHref="/evenements" />
        ) : events.length ? (
          <div className="featured-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            message={
              initialCategory || initialCity
                ? 'Aucun événement publié ne correspond à ces filtres.'
                : 'Aucun événement public n’est publié pour le moment.'
            }
            onReset={initialCategory || initialCity ? resetFilters : undefined}
          />
        )}
      </div>
    </section>
  );
}


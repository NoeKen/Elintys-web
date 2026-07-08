'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  defaultQuery?: string;
  defaultCity?: string;
  className?: string;
}

const CITIES = ['Montréal', 'Québec', 'Laval', 'Rive-Sud', 'Longueuil'];

export function SearchBar({ defaultQuery = '', defaultCity = 'Montréal', className = '' }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [city, setCity] = useState(defaultCity);
  const [date, setDate] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (city) params.set('city', city);
    if (date) params.set('date', date);
    router.push(`/evenements/recherche?${params.toString()}`);
  };

  return (
    <div className={`searchbar-container ${className}`}>
      <div className="searchbar-field">
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Rechercher un événement..."
          aria-label="Rechercher un événement"
        />
      </div>

      <div className="searchbar-divider" />

      <div className="searchbar-field searchbar-field--sm">
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }}
          aria-hidden="true"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Ville"
        >
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="searchbar-divider" />

      <div className="searchbar-field searchbar-field--sm">
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }}
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
          style={{ minWidth: 0 }}
        />
      </div>

      <button className="searchbar-btn" onClick={handleSearch}>
        Rechercher
      </button>
    </div>
  );
}

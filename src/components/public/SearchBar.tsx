'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import type { DiscoveryType } from '@/features/discovery/discovery-query';
import messages from '../../../messages/fr.json';

const copy = messages.publicSearch;

interface SearchBarProps {
  defaultQuery?: string;
  defaultType?: DiscoveryType;
  className?: string;
  showClear?: boolean;
}

export function SearchBar(props: SearchBarProps) {
  const { defaultQuery = '', defaultType = 'all' } = props;
  return (
    <SearchBarForm
      key={`${defaultType}:${defaultQuery}`}
      {...props}
      defaultQuery={defaultQuery}
      defaultType={defaultType}
    />
  );
}

function SearchBarForm({
  defaultQuery = '',
  defaultType = 'all',
  className = '',
  showClear = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [type, setType] = useState<DiscoveryType>(defaultType);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (type !== 'all') params.set('type', type);
    params.set('page', '1');
    router.push(`/evenements/recherche?${params.toString()}`);
  };

  return (
    <form role="search" aria-label={copy.metaTitle} className={`searchbar-container ${className}`} onSubmit={handleSearch}>
      <div className="searchbar-field">
        <Search className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.inputPlaceholder}
          aria-label={copy.inputLabel}
          minLength={2}
          maxLength={120}
        />
      </div>

      <div className="searchbar-divider" />

      <div className="searchbar-field searchbar-field--sm">
        <select
          value={type}
          onChange={(event) => setType(event.target.value as DiscoveryType)}
          aria-label={copy.typeLabel}
        >
          <option value="all">{copy.typeAll}</option>
          <option value="event">{copy.typeEvents}</option>
          <option value="vendor">{copy.typeVendors}</option>
          <option value="venue">{copy.typeVenues}</option>
        </select>
      </div>
      {showClear && (defaultQuery || defaultType !== 'all') && (
        <button
          type="button"
          className="searchbar-clear"
          onClick={() => router.push('/evenements/recherche')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {copy.clearFilters}
        </button>
      )}
      <button type="submit" className="searchbar-btn">
        {copy.submit}
      </button>
    </form>
  );
}

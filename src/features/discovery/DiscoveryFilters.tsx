import Link from 'next/link';
import {
  CITIES,
  EVENT_CATEGORIES,
  MINIMUM_CAPACITIES,
  PRICE_RANGES,
  VENUE_TYPE_OPTIONS,
  VENDOR_CATEGORY_OPTIONS,
} from '@/features/catalog/catalog-filters';
import { buildDiscoveryHref, type DiscoveryQuery, type DiscoveryType } from './discovery-query';
import messages from '../../../messages/fr.json';

const copy = messages.publicSearch;
const TABS: Array<{ value: DiscoveryType; label: string }> = [
  { value: 'all', label: copy.typeAll },
  { value: 'event', label: copy.typeEvents },
  { value: 'vendor', label: copy.typeVendors },
  { value: 'venue', label: copy.typeVenues },
];

export function DiscoveryFilters({ query }: { query: DiscoveryQuery }) {
  const categories = query.type === 'event'
    ? EVENT_CATEGORIES
    : query.type === 'vendor'
      ? VENDOR_CATEGORY_OPTIONS
      : VENUE_TYPE_OPTIONS;

  return (
    <div className="space-y-5">
      <nav aria-label={copy.resultTypes} className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={buildDiscoveryHref(query, { type: tab.value, page: 1 })}
            aria-current={query.type === tab.value ? 'page' : undefined}
            className={query.type === tab.value ? 'discovery-tab discovery-tab--active' : 'discovery-tab'}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {query.type !== 'all' && (
        <form method="get" action="/evenements/recherche" className="discovery-filter-panel" aria-label={copy.filters}>
          {query.q && <input type="hidden" name="q" value={query.q} />}
          <input type="hidden" name="type" value={query.type} />
          <input type="hidden" name="page" value="1" />

          <label className="discovery-filter-field">
            <span>{copy.city}</span>
            <select name="city" defaultValue={query.city ?? ''}>
              <option value="">{copy.anyCity}</option>
              {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>

          <label className="discovery-filter-field">
            <span>{query.type === 'venue' ? copy.venueType : copy.category}</span>
            <select name="category" defaultValue={query.category ?? ''}>
              <option value="">{copy.anyCategory}</option>
              {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          {query.type === 'event' && (
            <>
              <label className="discovery-filter-field">
                <span>{copy.dateFrom}</span>
                <input type="date" name="dateFrom" defaultValue={query.dateFrom ?? ''} />
              </label>
              <label className="discovery-filter-field">
                <span>{copy.dateTo}</span>
                <input type="date" name="dateTo" min={query.dateFrom} defaultValue={query.dateTo ?? ''} />
              </label>
            </>
          )}

          {query.type === 'vendor' && (
            <label className="discovery-filter-field">
              <span>{copy.price}</span>
              <select name="price" defaultValue={query.price ?? ''}>
                <option value="">{copy.anyPrice}</option>
                {PRICE_RANGES.map((price) => <option key={price} value={price}>{price}</option>)}
              </select>
            </label>
          )}

          {query.type === 'venue' && (
            <label className="discovery-filter-field">
              <span>{copy.capacity}</span>
              <select name="capacity" defaultValue={query.capacity ? String(query.capacity) : ''}>
                <option value="">{copy.anyCapacity}</option>
                {MINIMUM_CAPACITIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )}

          <button type="submit" className="premium-button min-h-11">{copy.applyFilters}</button>
          <Link href={buildDiscoveryHref(query, { type: query.type, q: query.q, page: 1, city: undefined, category: undefined, dateFrom: undefined, dateTo: undefined, price: undefined, capacity: undefined })} className="filter-reset min-h-11">
            {copy.clearFilters}
          </Link>
        </form>
      )}
    </div>
  );
}

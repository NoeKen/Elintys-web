import { describe, expect, it } from 'vitest';
import {
  buildCatalogQuery,
  EVENT_CATEGORIES,
  VENUE_TYPES,
  VENDOR_CATEGORIES,
} from './catalog-filters';

describe('catalog filters', () => {
  it('uses backend enum values instead of UI labels', () => {
    expect(VENDOR_CATEGORIES.find(({ label }) => label === 'Photographie')?.value).toBe(
      'photographe',
    );
    expect(VENUE_TYPES.find(({ label }) => label === 'Salle de conférence')?.value).toBe(
      'conference',
    );
    expect(EVENT_CATEGORIES.find(({ label }) => label === 'Atelier')?.value).toBe('workshop');
  });

  it('builds a trimmed query and omits empty filters', () => {
    expect(
      buildCatalogQuery({
        category: ' photographe ',
        city: '',
        price: '$$',
      }).toString(),
    ).toBe('page=1&limit=12&category=photographe&price=%24%24');
  });
});


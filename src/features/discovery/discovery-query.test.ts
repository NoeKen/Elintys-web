import { describe, expect, it } from 'vitest';
import {
  buildDiscoveryApiPath,
  buildDiscoveryHref,
  parseDiscoveryQuery,
} from './discovery-query';

describe('discovery query contract', () => {
  it('normalise les paramètres inconnus et borne la pagination', () => {
    expect(parseDiscoveryQuery({ q: '  gala  ', type: 'admin', page: '-5' })).toEqual({
      q: 'gala',
      type: 'all',
      page: 1,
    });
    expect(parseDiscoveryQuery({ q: 'gala', type: 'event', page: '999999' }).page).toBe(10_000);
  });

  it('conserve uniquement les filtres applicables au type événement', () => {
    expect(parseDiscoveryQuery({
      q: 'gala',
      type: 'event',
      city: 'Montréal',
      category: 'gala',
      dateFrom: '2027-05-01',
      dateTo: '2027-05-31',
      price: '$$',
      capacity: '200',
    })).toEqual({
      q: 'gala',
      type: 'event',
      city: 'Montréal',
      category: 'gala',
      dateFrom: '2027-05-01',
      dateTo: '2027-05-31',
      page: 1,
    });
  });

  it('produit un appel API distinct par type sans filtre silencieusement ignoré', () => {
    expect(buildDiscoveryApiPath(parseDiscoveryQuery({
      q: 'photo',
      type: 'vendor',
      city: 'Laval',
      category: 'photographe',
      price: '$$',
      page: '2',
    }))).toBe('/discovery/vendors?q=photo&city=Laval&category=photographe&price=%24%24&page=2&limit=12');

    expect(buildDiscoveryApiPath(parseDiscoveryQuery({
      q: 'salle',
      type: 'venue',
      category: 'reception',
      capacity: '200',
    }))).toBe('/discovery/venues?q=salle&capacity=200&page=1&limit=12&type=reception');

    expect(buildDiscoveryApiPath(parseDiscoveryQuery({
      q: 'gala',
      type: 'event',
      category: 'gala',
      dateFrom: '2027-05-01',
    }))).toBe('/discovery/events?q=gala&dateFrom=2027-05-01&page=1&limit=12&type=gala');
  });

  it('produit une URL partageable et remet page à 1 quand un filtre change', () => {
    const current = parseDiscoveryQuery({ q: 'gala', type: 'event', page: '3' });
    expect(buildDiscoveryHref(current, { city: 'Québec' })).toBe(
      '/evenements/recherche?q=gala&type=event&city=Qu%C3%A9bec&page=1',
    );
  });

  it('rejette localement les dates et filtres numériques invalides', () => {
    expect(parseDiscoveryQuery({ type: 'event', dateFrom: '2027-99-99' }).dateFrom).toBeUndefined();
    expect(parseDiscoveryQuery({ type: 'venue', capacity: '-2' }).capacity).toBeUndefined();
  });
});

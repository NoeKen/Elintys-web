import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DiscoveryResults } from './DiscoveryResults';
import { parseDiscoveryQuery } from './discovery-query';

vi.mock('@/components/favorites/FavoriteButton', () => ({ FavoriteButton: () => null }));

const empty = {
  events: [],
  vendors: [],
  venues: [],
  totals: { events: 0, vendors: 0, venues: 0 },
};

describe('DiscoveryResults', () => {
  it('distingue un résultat vide d’une panne', () => {
    const query = parseDiscoveryQuery({ q: 'introuvable' });
    const { rerender } = render(
      <DiscoveryResults query={query} result={empty} hasError={false} retryHref="/evenements/recherche?q=introuvable" />,
    );
    expect(screen.getByTestId('search-empty-state')).toHaveTextContent('Aucun résultat');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<DiscoveryResults query={query} result={empty} hasError retryHref="/evenements/recherche?q=introuvable" />);
    expect(screen.getByRole('alert')).toHaveTextContent('temporairement indisponible');
    expect(screen.queryByTestId('search-empty-state')).not.toBeInTheDocument();
  });

  it('annonce le nombre de résultats aux technologies d’assistance', () => {
    const query = parseDiscoveryQuery({ q: 'gala' });
    render(
      <DiscoveryResults
        query={query}
        hasError={false}
        retryHref="/evenements/recherche?q=gala"
        result={{ ...empty, events: [{ _id: '1', title: 'Gala', slug: 'gala', startDate: '2027-05-01' }], totals: { events: 1, vendors: 0, venues: 0 } }}
      />,
    );
    expect(screen.getByText('1 résultat trouvé')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('link', { name: 'Voir' })).toHaveAttribute('href', '/evenements/gala');
  });
});

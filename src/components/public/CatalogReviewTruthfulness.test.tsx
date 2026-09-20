import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VendorCard } from './VendorCard';
import { VenueCard } from './VenueCard';

vi.mock('@/components/favorites/FavoriteButton', () => ({ FavoriteButton: () => <button type="button">Favori</button> }));

describe('réputation vérifiée dans les catalogues', () => {
  it('n’affiche pas les anciens compteurs de note avant le futur badge vérifié', () => {
    render(<><VendorCard vendor={{ _id: 'vendor-1', businessName: 'Studio', rating: 4.8, reviewCount: 38 }} /><VenueCard venue={{ _id: 'venue-1', name: 'Atrium', rating: 4.6, reviewCount: 12 }} /></>);
    expect(screen.queryByText('4.8')).not.toBeInTheDocument();
    expect(screen.queryByText('4.6')).not.toBeInTheDocument();
    expect(screen.queryByText(/38 avis|12 avis/)).not.toBeInTheDocument();
  });
});

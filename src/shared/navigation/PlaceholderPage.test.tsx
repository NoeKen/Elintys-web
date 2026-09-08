import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlaceholderPage } from './PlaceholderPage';

describe('PlaceholderPage', () => {
  it('annonce explicitement un état futur sans simuler une fonctionnalité active', () => {
    render(
      <PlaceholderPage
        title="Recherche d'événements"
        description="La recherche avancée n’est pas encore disponible."
        backHref="/evenements"
        backLabel="Parcourir le catalogue"
      />,
    );

    expect(screen.getByText('Fonctionnalité à venir')).toBeInTheDocument();
    expect(screen.getByText(/n’est pas encore disponible/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Parcourir le catalogue' })).toHaveAttribute('href', '/evenements');
  });
});

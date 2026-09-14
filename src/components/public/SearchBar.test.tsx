import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('SearchBar', () => {
  it('expose un vrai formulaire de recherche et soumet un état URL typé', () => {
    render(<SearchBar defaultQuery="gala" defaultType="event" />);

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText(/que recherchez-vous/i)).toHaveValue('gala');
    fireEvent.submit(screen.getByRole('search'));
    expect(push).toHaveBeenCalledWith('/evenements/recherche?q=gala&type=event&page=1');
  });

  it('permet d’effacer tous les critères', () => {
    render(<SearchBar defaultQuery="gala" defaultType="event" showClear />);

    fireEvent.click(screen.getByRole('button', { name: /effacer/i }));
    expect(push).toHaveBeenCalledWith('/evenements/recherche');
  });

  it('se resynchronise lorsque la navigation URL change les critères serveur', () => {
    const { rerender } = render(<SearchBar defaultQuery="gala" defaultType="event" />);

    rerender(<SearchBar defaultQuery="photo" defaultType="vendor" />);

    expect(screen.getByLabelText(/que recherchez-vous/i)).toHaveValue('photo');
    expect(screen.getByLabelText(/type de résultat/i)).toHaveValue('vendor');
  });
});

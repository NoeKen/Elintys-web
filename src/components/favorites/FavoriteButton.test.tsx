import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoriteButton } from './FavoriteButton';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  push: vi.fn(),
  toggle: vi.fn(),
  favoriteState: {
    isFavorite: false,
    isPending: false,
    isLoading: false,
    isUnavailable: false,
    error: null as unknown,
  },
  pathname: '/prestataires',
  search: '',
}));

vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => mocks.useAuth() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => mocks.pathname,
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock('@/features/favorites/hooks/useFavorites', () => ({
  useFavorite: () => ({ ...mocks.favoriteState, toggle: mocks.toggle }),
}));

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.favoriteState = {
      isFavorite: false,
      isPending: false,
      isLoading: false,
      isUnavailable: false,
      error: null,
    };
    mocks.pathname = '/prestataires';
    mocks.search = '';
    mocks.useAuth.mockReturnValue({ user: { id: 'u1' } });
  });

  it('bascule le favori pour un utilisateur connecté', async () => {
    render(<FavoriteButton targetId="vendor-1" targetType="vendor" />);

    await userEvent.click(screen.getByTestId('favorite-button'));

    expect(mocks.toggle).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('redirige un visiteur anonyme vers la connexion en préservant le retour', async () => {
    // Régression : le bouton n'appelait que preventDefault — il annonçait une
    // action au lecteur d'écran puis n'en déclenchait aucune.
    mocks.useAuth.mockReturnValue({ user: null });
    mocks.pathname = '/lieux';
    mocks.search = 'city=Montr%C3%A9al';

    render(<FavoriteButton targetId="venue-1" targetType="venue" />);
    await userEvent.click(screen.getByTestId('favorite-button'));

    expect(mocks.toggle).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith(
      '/connexion?redirect=%2Flieux%3Fcity%3DMontr%C3%A9al',
    );
  });

  it('conserve le repère « connexion requise » pour un anonyme', () => {
    mocks.useAuth.mockReturnValue({ user: null });

    render(<FavoriteButton targetId="venue-1" targetType="venue" />);
    const button = screen.getByTestId('favorite-button');

    expect(button).toHaveAttribute('title', 'Connectez-vous pour sauvegarder');
    expect(button.getAttribute('aria-label')).toContain('connexion requise');
    // Pas d'état pressé pour un anonyme : il n'a pas de favori.
    expect(button).not.toHaveAttribute('aria-pressed');
  });

  it('expose aria-pressed et un libellé propre au type de cible', () => {
    mocks.favoriteState.isFavorite = true;

    render(<FavoriteButton targetId="event-1" targetType="event" />);
    const button = screen.getByTestId('favorite-button');

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAccessibleName('Retirer cet événement des favoris');
  });

  it("rend l'échec d'une bascule perceptible", () => {
    mocks.favoriteState.error = new Error('réseau');

    render(<FavoriteButton targetId="event-1" targetType="event" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('désactive le bouton pendant la bascule', () => {
    mocks.favoriteState.isPending = true;

    render(<FavoriteButton targetId="event-1" targetType="event" />);

    expect(screen.getByTestId('favorite-button')).toBeDisabled();
  });
});

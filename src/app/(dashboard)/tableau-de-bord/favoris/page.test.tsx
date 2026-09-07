import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Favorite } from '@/features/favorites/favorites.service';
import DashboardFavorisPage from './page';

const mocks = vi.hoisted(() => ({
  state: {
    data: [] as Favorite[],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}));

vi.mock('@/features/favorites/hooks/useFavorites', () => ({
  useFavorites: () => mocks.state,
}));
vi.mock('@/components/favorites/FavoriteButton', () => ({
  FavoriteButton: ({ targetId }: { targetId: string }) => (
    <button type="button" data-testid={`favorite-button-${targetId}`}>♡</button>
  ),
}));

const eventFavorite: Favorite = {
  _id: 'fav-1',
  targetType: 'event',
  targetId: '6a9245f2e7576da34d6c0b31',
  target: {
    _id: '6a9245f2e7576da34d6c0b31',
    label: 'Gala annuel Elintys',
    href: '/evenements/gala-annuel-elintys',
    startDate: '2026-12-01T18:00:00.000Z',
  },
};

describe('Page Mes favoris', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = { data: [], isLoading: false, isError: false, refetch: vi.fn() };
  });

  it('affiche le titre métier et le lien public, jamais un ObjectId brut', () => {
    mocks.state.data = [eventFavorite];

    render(<DashboardFavorisPage />);

    expect(screen.getByText('Gala annuel Elintys')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Gala annuel Elintys/ })).toHaveAttribute(
      'href',
      '/evenements/gala-annuel-elintys',
    );
    // Régression F-01 : la page affichait `fav.targetId` comme libellé.
    expect(screen.queryByText('6a9245f2e7576da34d6c0b31')).not.toBeInTheDocument();
  });

  it('utilise le slug fourni par le serveur, pas l’identifiant', () => {
    mocks.state.data = [eventFavorite];

    render(<DashboardFavorisPage />);

    // La route publique événement est /evenements/[slug] : un lien construit
    // avec l'id menait à une page introuvable.
    expect(
      screen.queryByRole('link', { name: /Gala/ })?.getAttribute('href'),
    ).not.toContain('6a9245f2e7576da34d6c0b31');
  });

  it('groupe par type et affiche les prestataires et lieux', () => {
    mocks.state.data = [
      eventFavorite,
      {
        _id: 'fav-2',
        targetType: 'vendor',
        targetId: 'v1',
        target: { _id: 'v1', label: 'Lumière Nord', href: '/prestataires/v1' },
      },
      {
        _id: 'fav-3',
        targetType: 'venue',
        targetId: 'l1',
        target: { _id: 'l1', label: 'Maison Saint-Laurent', href: '/lieux/l1' },
      },
    ];

    render(<DashboardFavorisPage />);

    expect(screen.getByRole('heading', { name: 'Événements' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prestataires' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lieux' })).toBeInTheDocument();
  });

  it('signale une cible supprimée sans afficher d’identifiant technique', () => {
    mocks.state.data = [{ ...eventFavorite, target: null }];

    render(<DashboardFavorisPage />);

    expect(screen.getByText('Cet élément n’est plus disponible.')).toBeInTheDocument();
    expect(screen.queryByText('6a9245f2e7576da34d6c0b31')).not.toBeInTheDocument();
  });

  it('distingue une erreur de chargement d’une liste vide', () => {
    // Cœur du finding : un 404 était rendu comme « Aucun favori ».
    mocks.state.isError = true;

    render(<DashboardFavorisPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('affiche un état vide explicite quand la liste est réellement vide', () => {
    render(<DashboardFavorisPage />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('affiche un état de chargement distinct', () => {
    mocks.state.isLoading = true;

    render(<DashboardFavorisPage />);

    expect(screen.getByLabelText('Chargement des favoris')).toBeInTheDocument();
  });

  it('permet de retirer un favori depuis la liste', () => {
    mocks.state.data = [eventFavorite];

    render(<DashboardFavorisPage />);

    expect(
      screen.getByTestId('favorite-button-6a9245f2e7576da34d6c0b31'),
    ).toBeInTheDocument();
  });
});

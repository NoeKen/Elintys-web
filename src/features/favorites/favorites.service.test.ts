import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import { favoritesService, type Favorite } from './favorites.service';

vi.mock('@/shared/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const enrichedFavorite: Favorite = {
  _id: 'fav-1',
  targetType: 'event',
  targetId: 'event-1',
  target: {
    _id: 'event-1',
    label: 'Gala annuel',
    href: '/evenements/gala-annuel',
  },
};

describe('favoritesService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lit la liste sur la route canonique GET /favorites', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [enrichedFavorite], status: 200 });

    await expect(favoritesService.list()).resolves.toEqual([enrichedFavorite]);
    expect(api.get).toHaveBeenCalledWith('/favorites', { params: {} });
  });

  it('filtre par type avec le paramètre `type` attendu par le contrôleur', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], status: 200 });

    await favoritesService.list('vendor');

    // Le contrôleur lit @Query('type'), pas 'targetType'.
    expect(api.get).toHaveBeenCalledWith('/favorites', { params: { type: 'vendor' } });
  });

  it('ajoute via POST /favorites avec targetType et targetId dans le corps', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined, status: 201 });

    await favoritesService.add('venue', 'venue-1');

    expect(api.post).toHaveBeenCalledWith('/favorites', {
      targetType: 'venue',
      targetId: 'venue-1',
    });
  });

  it('supprime via DELETE /favorites en passant la cible dans le CORPS', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined, status: 204 });

    await favoritesService.remove('event', 'event-1');

    // Régression F-01 : l'ancien client appelait DELETE /favorites/:id, une
    // route qui n'existe pas côté API et répondait 404.
    expect(api.delete).toHaveBeenCalledWith('/favorites', {
      data: { targetType: 'event', targetId: 'event-1' },
    });
  });

  it("n'expose aucune route de vérification par cible", () => {
    // Un `check` par carte reproduirait le N+1 supprimé par cette vague.
    expect(Object.keys(favoritesService).sort()).toEqual(['add', 'list', 'remove']);
  });
});

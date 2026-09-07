import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { favoritesService, type Favorite } from '@/features/favorites/favorites.service';
import { useFavorite, useFavorites, FAVORITES_QUERY_KEY } from './useFavorites';

const mocks = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => mocks.useAuth() }));
vi.mock('@/features/favorites/favorites.service', () => ({
  favoritesService: { list: vi.fn(), add: vi.fn(), remove: vi.fn() },
}));

const eventFavorite: Favorite = {
  _id: 'fav-1',
  targetType: 'event',
  targetId: 'event-1',
  target: { _id: 'event-1', label: 'Gala', href: '/evenements/gala' },
};

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'u1' } });
  });

  it("n'interroge pas l'API pour un visiteur anonyme", async () => {
    mocks.useAuth.mockReturnValue({ isAuthenticated: false, user: null });
    const client = makeClient();

    renderHook(() => useFavorites(), { wrapper: wrapper(client) });

    await waitFor(() => expect(favoritesService.list).not.toHaveBeenCalled());
  });

  it('dérive isFavorite de la liste partagée sans appel par cible', async () => {
    vi.mocked(favoritesService.list).mockResolvedValue([eventFavorite]);
    const client = makeClient();

    const { result } = renderHook(() => useFavorite('event-1', 'event'), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isFavorite).toBe(true));
    // Une seule requête pour tout l'écran : c'est la suppression du N+1.
    expect(favoritesService.list).toHaveBeenCalledTimes(1);
  });

  it('distingue une cible absente de la liste', async () => {
    vi.mocked(favoritesService.list).mockResolvedValue([eventFavorite]);
    const client = makeClient();

    const { result } = renderHook(() => useFavorite('event-2', 'event'), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isFavorite).toBe(false);
  });

  it('ne confond pas deux cibles de types différents avec le même id', async () => {
    vi.mocked(favoritesService.list).mockResolvedValue([eventFavorite]);
    const client = makeClient();

    const { result } = renderHook(() => useFavorite('event-1', 'venue'), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isFavorite).toBe(false);
  });

  it('ajoute de façon optimiste puis confirme auprès du serveur', async () => {
    vi.mocked(favoritesService.list).mockResolvedValue([]);
    vi.mocked(favoritesService.add).mockResolvedValue(undefined);
    const client = makeClient();

    const { result } = renderHook(() => useFavorite('event-9', 'event'), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggle());

    await waitFor(() => expect(favoritesService.add).toHaveBeenCalledWith('event', 'event-9'));
  });

  it('restaure la liste quand la bascule échoue et expose l’erreur', async () => {
    // Sans rollback ET sans erreur exposée, le cœur resterait rempli alors
    // que rien n'a été enregistré : l'UI affirmerait un succès inexistant.
    vi.mocked(favoritesService.list).mockResolvedValue([]);
    vi.mocked(favoritesService.add).mockRejectedValue(new Error('réseau'));
    const client = makeClient();

    const { result } = renderHook(() => useFavorite('event-9', 'event'), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggle());

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(client.getQueryData<Favorite[]>(FAVORITES_QUERY_KEY)).toEqual([]);
  });

  it('retire une cible déjà en favori', async () => {
    vi.mocked(favoritesService.list).mockResolvedValue([eventFavorite]);
    vi.mocked(favoritesService.remove).mockResolvedValue(undefined);
    const client = makeClient();

    const { result } = renderHook(() => useFavorite('event-1', 'event'), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(result.current.isFavorite).toBe(true));

    act(() => result.current.toggle());

    await waitFor(() => expect(favoritesService.remove).toHaveBeenCalledWith('event', 'event-1'));
  });

  it('signale une liste indisponible au lieu de la présenter comme vide', async () => {
    vi.mocked(favoritesService.list).mockRejectedValue(new Error('boom'));
    const client = makeClient();

    const { result } = renderHook(() => useFavorite('event-1', 'event'), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(result.current.isFavorite).toBe(false);
  });
});

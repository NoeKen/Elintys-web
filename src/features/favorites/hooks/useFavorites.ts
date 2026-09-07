"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  favoritesService,
  type Favorite,
  type FavoriteTargetType,
} from "@/features/favorites/favorites.service";

/**
 * Clé UNIQUE des favoris.
 *
 * Toutes les cartes d'un catalogue lisent la même entrée de cache : une seule
 * requête réseau pour la page entière, au lieu d'un appel « est-ce un
 * favori ? » par carte.
 */
export const FAVORITES_QUERY_KEY = ["favorites"] as const;

export function useFavorites() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: () => favoritesService.list(),
    // Un anonyme n'a pas de favoris : inutile de provoquer un 401.
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

function isSameTarget(favorite: Favorite, targetId: string, targetType: FavoriteTargetType) {
  return favorite.targetId === targetId && favorite.targetType === targetType;
}

export interface UseFavoriteResult {
  isFavorite: boolean;
  toggle: () => void;
  isPending: boolean;
  /** Chargement initial de la liste : l'état du cœur n'est pas encore connu. */
  isLoading: boolean;
  /** Vrai si la liste n'a PAS pu être chargée — à distinguer de « aucun favori ». */
  isUnavailable: boolean;
  /** Échec de la dernière bascule. Doit être rendu visible par l'appelant. */
  error: unknown;
}

/**
 * État et bascule d'un favori, dérivés de la liste partagée.
 *
 * L'ancienne implémentation interrogeait `GET /favorites/check/:id` par carte —
 * une route qui n'existait pas côté API. L'état est désormais dérivé du cache,
 * ce qui supprime à la fois la divergence de contrat et le N+1.
 */
export function useFavorite(
  targetId: string,
  targetType: FavoriteTargetType,
): UseFavoriteResult {
  const queryClient = useQueryClient();
  const { data: favorites, isLoading, isError } = useFavorites();

  const isFavorite = (favorites ?? []).some((favorite) =>
    isSameTarget(favorite, targetId, targetType),
  );

  const mutation = useMutation({
    mutationFn: () =>
      isFavorite
        ? favoritesService.remove(targetType, targetId)
        : favoritesService.add(targetType, targetId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<Favorite[]>(FAVORITES_QUERY_KEY);

      // Mise à jour optimiste de la LISTE : c'est elle la source de vérité de
      // l'état affiché, donc c'est elle qu'il faut restaurer en cas d'échec.
      queryClient.setQueryData<Favorite[]>(FAVORITES_QUERY_KEY, (current = []) =>
        isFavorite
          ? current.filter((favorite) => !isSameTarget(favorite, targetId, targetType))
          : [
              ...current,
              {
                _id: `optimistic:${targetType}:${targetId}`,
                targetType,
                targetId,
                // L'enrichissement vient du serveur : on ne l'invente pas.
                target: null,
              },
            ],
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      // Rollback : sans lui, le cœur reste rempli alors que rien n'a été
      // enregistré — l'UI affirmerait un succès qui n'a pas eu lieu.
      if (context?.previous !== undefined) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    },

    // Le serveur reste l'autorité : on refetch quoi qu'il arrive, ce qui
    // remplace aussi l'entrée optimiste par la version enrichie.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });

  return {
    isFavorite,
    toggle: () => mutation.mutate(),
    isPending: mutation.isPending,
    isLoading,
    isUnavailable: isError,
    error: mutation.error,
  };
}

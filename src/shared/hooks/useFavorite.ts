"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  favoritesService,
  type FavoriteTargetType,
} from "@/features/favorites/favorites.service";

export function useFavorite(
  targetId: string,
  targetType: FavoriteTargetType,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const queryKey = ["favorite", targetId, targetType] as const;

  const { data: isFavorite = false } = useQuery({
    queryKey,
    queryFn: () => favoritesService.check(targetId, targetType),
    enabled: enabled && !!targetId,
    staleTime: 60_000,
  });

  const { mutate: toggle, isPending: isLoading } = useMutation({
    mutationFn: () =>
      isFavorite
        ? favoritesService.remove(targetId, targetType)
        : favoritesService.add(targetId, targetType),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<boolean>(queryKey);
      queryClient.setQueryData(queryKey, !isFavorite);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  return { isFavorite, toggle, isLoading };
}

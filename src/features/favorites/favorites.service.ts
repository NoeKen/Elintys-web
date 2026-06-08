import api from "@/shared/lib/api";

export type FavoriteTargetType = "event" | "vendor" | "venue";

export interface Favorite {
  _id: string;
  targetId: string;
  targetType: FavoriteTargetType;
  userId: string;
  createdAt: string;
}

export interface FavoriteCheckResponse {
  isFavorite: boolean;
}

export const favoritesService = {
  async add(targetId: string, targetType: FavoriteTargetType): Promise<void> {
    await api.post("/favorites", { targetId, targetType });
  },

  async remove(targetId: string, targetType: FavoriteTargetType): Promise<void> {
    await api.delete(`/favorites/${targetId}`, {
      params: { type: targetType },
    });
  },

  async check(
    targetId: string,
    targetType: FavoriteTargetType
  ): Promise<boolean> {
    const res = await api.get<FavoriteCheckResponse>(
      `/favorites/check/${targetId}`,
      { params: { type: targetType } }
    );
    return res.data.isFavorite ?? false;
  },

  async getAll(targetType?: FavoriteTargetType): Promise<Favorite[]> {
    const res = await api.get<Favorite[]>("/favorites", {
      params: targetType ? { type: targetType } : {},
    });
    return res.data;
  },
};

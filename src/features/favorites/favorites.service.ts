import api from "@/shared/lib/api";

export type FavoriteTargetType = "event" | "vendor" | "venue";

/**
 * Informations métier d'une cible, calculées par le serveur.
 *
 * `href` est fourni par l'API et non reconstruit côté client : la route
 * publique d'un événement utilise son `slug`, que le client ne connaît pas
 * depuis un simple favori.
 */
export interface FavoriteTarget {
  _id: string;
  label: string;
  href?: string;
  imageUrl?: string;
  subtitle?: string;
  startDate?: string;
}

export interface Favorite {
  _id: string;
  targetType: FavoriteTargetType;
  targetId: string;
  createdAt?: string;
  /** `null` lorsque la cible a été supprimée depuis la mise en favori. */
  target: FavoriteTarget | null;
}

/**
 * Client UNIQUE des favoris.
 *
 * Il n'existe volontairement pas de second client : la fonctionnalité a été
 * cassée par deux implémentations concurrentes désalignées de l'API réelle.
 * Toute lecture d'état favori passe par `list()`, jamais par un appel par
 * cible — un `check` par carte produisait N requêtes par page.
 */
export const favoritesService = {
  async list(targetType?: FavoriteTargetType): Promise<Favorite[]> {
    const res = await api.get<Favorite[]>("/favorites", {
      params: targetType ? { type: targetType } : {},
    });
    return res.data;
  },

  async add(targetType: FavoriteTargetType, targetId: string): Promise<void> {
    await api.post("/favorites", { targetType, targetId });
  },

  /** L'API attend la cible dans le CORPS de la requête, pas dans le chemin. */
  async remove(targetType: FavoriteTargetType, targetId: string): Promise<void> {
    await api.delete("/favorites", { data: { targetType, targetId } });
  },
};

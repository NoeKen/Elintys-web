export interface PublicEvent {
  _id: string;
  title: string;
  startDate?: string;
  location?: {
    type?: string;
    name?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  status?: string;
  slug?: string;
  coverImage?: string | {
    url: string;
    publicId?: string;
    width?: number;
    height?: number;
  };
}

/** Réponse réelle de `GET /discovery/events` (`data` + `total`). */
export interface DiscoveryPage<T> {
  data: T[];
  total: number;
}

/**
 * Filtres réellement supportés par `GET /discovery/events`.
 *
 * L'ancienne forme envoyait `query`, `category`, `startDate`, `endDate`,
 * `location` et `perPage` : aucun de ces paramètres n'existait côté API. Ils
 * étaient silencieusement ignorés, donnant l'illusion d'un filtrage. Depuis
 * que la route valide ses entrées, ils produiraient un 400 — le contrat est
 * donc aligné sur ce que le serveur accepte vraiment.
 */
export interface DiscoveryFilters {
  /** Terme de recherche, deux caractères minimum côté API. */
  q?: string;
  city?: string;
  page?: number;
  /** Plafonné à 50 par l'API. */
  limit?: number;
}

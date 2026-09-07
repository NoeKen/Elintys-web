export interface PublicEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  coverImageUrl?: string;
  ticketPrice?: number;
  currency?: string;
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

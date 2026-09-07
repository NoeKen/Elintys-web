export const EVENT_CATEGORIES = [
  { label: 'Conférence', value: 'conference', color: '#4A8E9E' },
  { label: 'Mariage', value: 'wedding', color: '#8F6577' },
  { label: 'Gala', value: 'gala', color: '#1E3D4F' },
  { label: 'Concert', value: 'concert', color: '#3C6478' },
  { label: 'Festival', value: 'festival', color: '#6B4226' },
  { label: 'Atelier', value: 'workshop', color: '#C8862A' },
  { label: 'Corporatif', value: 'corporate', color: '#2A4E7A' },
  { label: 'Anniversaire', value: 'birthday', color: '#A6654E' },
  { label: 'Réseautage', value: 'networking', color: '#316B65' },
  { label: 'Autre', value: 'other', color: '#5D6670' },
] as const;

/**
 * Énumération `VendorCategory` du backend, EN ENTIER.
 *
 * Source unique pour tout formulaire qui écrit une catégorie : le champ est
 * validé par `@IsEnum(VendorCategory)` côté API, une saisie libre y est
 * systématiquement refusée en 400.
 */
export const VENDOR_CATEGORY_OPTIONS = [
  { label: 'Photographie', value: 'photographe' },
  { label: 'Traiteur', value: 'traiteur' },
  { label: 'Musique & DJ', value: 'dj' },
  { label: 'Décoration', value: 'decorateur' },
  { label: 'Animation', value: 'animateur' },
  { label: 'Sonorisation', value: 'sonorisation' },
  { label: 'Autre', value: 'autre' },
] as const;

/** Énumération `VenueType` du backend, EN ENTIER. */
export const VENUE_TYPE_OPTIONS = [
  { label: 'Salle de conférence', value: 'conference' },
  { label: 'Espace de réception', value: 'reception' },
  { label: 'Studio', value: 'studio' },
  { label: 'Restaurant privatif', value: 'restaurant' },
  { label: 'Rooftop', value: 'rooftop' },
  { label: 'Salle de spectacle', value: 'spectacle' },
  { label: 'Autre', value: 'other' },
] as const;

/**
 * Filtres du catalogue public — sous-ensemble volontaire des énumérations
 * ci-dessus : « Autre » n'est pas un critère de recherche exploitable.
 * Dérivés, pour ne pas diverger de l'énumération backend.
 */
export const VENDOR_CATEGORIES = VENDOR_CATEGORY_OPTIONS.filter(
  (option) => option.value !== 'autre',
);

export const VENUE_TYPES = VENUE_TYPE_OPTIONS.filter((option) => option.value !== 'other');

export const CITIES = ['Montréal', 'Québec', 'Laval', 'Longueuil'] as const;
export const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'] as const;
export const MINIMUM_CAPACITIES = [
  { label: 'Au moins 50 personnes', value: '50' },
  { label: 'Au moins 200 personnes', value: '200' },
  { label: 'Au moins 500 personnes', value: '500' },
  { label: 'Au moins 1 000 personnes', value: '1000' },
] as const;

type QueryValue = string | undefined;

export function buildCatalogQuery(
  values: Record<string, QueryValue>,
  defaults: Record<string, string> = { page: '1', limit: '12' },
): URLSearchParams {
  const query = new URLSearchParams(defaults);

  Object.entries(values).forEach(([key, value]) => {
    const normalized = value?.trim();
    if (normalized) query.set(key, normalized);
  });

  return query;
}


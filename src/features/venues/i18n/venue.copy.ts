const fr = {
  previous: 'Précédent', next: 'Suivant', page: 'Page', type: 'Type de lieu', amenities: 'Équipements disponibles',
  conference: 'Conférence', reception: 'Réception', studio: 'Studio', restaurant: 'Restaurant', rooftop: 'Terrasse', spectacle: 'Spectacle', other: 'Autre',
  profile: 'Mon profil', venues: 'Mes lieux', add: 'Ajouter un lieu', edit: 'Modifier', reservations: 'Réservations',
  intro: 'Présentez votre activité de gestionnaire. Vous ajouterez vos lieux séparément, quand vous le souhaiterez.',
  onboarding: 'Votre profil de gestionnaire', finish: 'Terminer mon profil', save: 'Enregistrer', saving: 'Enregistrement…', saved: 'Modifications enregistrées.',
  loading: 'Chargement…', error: 'Impossible de charger ces données. Réessayez.', saveError: 'Impossible d’enregistrer. Vérifiez vos informations puis réessayez.', retry: 'Réessayer',
  empty: 'Vous n’avez pas encore de lieu.', emptyBody: 'Votre profil est indépendant de vos lieux. Ajoutez votre premier espace lorsque vous êtes prêt.',
  missing: 'Lieu introuvable dans votre compte.', managerRequired: 'Complétez votre profil de gestionnaire avant d’ajouter un lieu.', back: 'Retour à mes lieux',
  active: 'Actif', inactive: 'Inactif', public: 'Voir la fiche publique', editTitle: 'Modifier le lieu', invalid: 'Vérifiez ce champ.', required: 'Ce champ est requis.',
  professionalName: 'Nom professionnel', description: 'Description', region: 'Région', contactEmail: 'Courriel de contact', contactPhone: 'Téléphone de contact',
  name: 'Nom du lieu', capacity: 'Capacité (personnes)', pricePerDay: 'Prix par jour (CAD)', street: 'Rue', city: 'Ville', province: 'Province', postalCode: 'Code postal',
  venue: 'Lieu', unknownVenue: 'Lieu non disponible', noPrice: 'Sur devis', day: 'jour', language: 'Langue',
};
export type VenueCopy = { [K in keyof typeof fr]: string };
const en: VenueCopy = {
  previous: 'Previous', next: 'Next', page: 'Page', type: 'Venue type', amenities: 'Available amenities',
  conference: 'Conference', reception: 'Reception', studio: 'Studio', restaurant: 'Restaurant', rooftop: 'Rooftop', spectacle: 'Performance', other: 'Other',
  profile: 'My profile', venues: 'My venues', add: 'Add a venue', edit: 'Edit', reservations: 'Bookings',
  intro: 'Introduce your venue management business. Add your venues separately when you are ready.',
  onboarding: 'Your venue manager profile', finish: 'Complete my profile', save: 'Save', saving: 'Saving…', saved: 'Changes saved.',
  loading: 'Loading…', error: 'Unable to load this information. Please try again.', saveError: 'Unable to save. Check your information and try again.', retry: 'Try again',
  empty: 'You have no venues yet.', emptyBody: 'Your profile is separate from your venues. Add your first space when you are ready.',
  missing: 'Venue not found in your account.', managerRequired: 'Complete your manager profile before adding a venue.', back: 'Back to my venues',
  active: 'Active', inactive: 'Inactive', public: 'View public page', editTitle: 'Edit venue', invalid: 'Check this field.', required: 'This field is required.',
  professionalName: 'Professional name', description: 'Description', region: 'Region', contactEmail: 'Contact email', contactPhone: 'Contact phone',
  name: 'Venue name', capacity: 'Capacity (people)', pricePerDay: 'Daily price (CAD)', street: 'Street', city: 'City', province: 'Province', postalCode: 'Postal code',
  venue: 'Venue', unknownVenue: 'Venue unavailable', noPrice: 'On request', day: 'day', language: 'Language',
};
export const venueCopy = { fr, en };
export type VenueLocale = keyof typeof venueCopy;
export function formatVenuePrice(value: number, locale: VenueLocale = 'fr') {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

import type { PublicEventDetail } from '@/features/events/types';

/**
 * Tolère un cache ISR produit par l'ancien contrat pendant un déploiement
 * progressif, sans inventer de contenu. Les champs structurants restent requis;
 * les nouvelles collections relationnelles deviennent simplement vides.
 */
export function normalizePublicEventDetail(value: unknown): PublicEventDetail | null {
  if (!value || typeof value !== 'object') return null;
  const event = value as Partial<PublicEventDetail>;
  if (
    typeof event._id !== 'string'
    || typeof event.slug !== 'string'
    || typeof event.title !== 'string'
    || typeof event.startDate !== 'string'
  ) return null;

  return {
    ...event,
    _id: event._id,
    slug: event.slug,
    title: event.title,
    startDate: event.startDate,
    gallery: Array.isArray(event.gallery) ? event.gallery : [],
    timezone: typeof event.timezone === 'string' ? event.timezone : 'America/Toronto',
    dateIsTentative: Boolean(event.dateIsTentative),
    discoverability: event.discoverability === 'public' ? 'public' : 'unlisted',
    accessPolicy: event.accessPolicy && typeof event.accessPolicy.type === 'string'
      ? event.accessPolicy
      : { type: 'open' },
    admissionModes: Array.isArray(event.admissionModes) ? event.admissionModes : [],
    providers: Array.isArray(event.providers) ? event.providers : [],
    ticketTypes: Array.isArray(event.ticketTypes) ? event.ticketTypes : [],
    relatedEvents: Array.isArray(event.relatedEvents) ? event.relatedEvents : [],
  };
}

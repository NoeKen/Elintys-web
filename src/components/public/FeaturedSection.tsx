import Link from 'next/link';
import { EventCard, type EventCardData } from '@/components/events/EventCard';

interface RawFeaturedEvent {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  startDate?: string;
  location?: { city?: string };
  locationCity?: string;
  coverImage?: string;
  eventType?: string;
  status?: string;
  minPrice?: number;
}

function normalize(e: RawFeaturedEvent): EventCardData {
  const id = e._id ?? e.id ?? e.slug ?? 'event';
  return {
    _id: id,
    title: e.title ?? 'Événement',
    slug: e.slug ?? id,
    startDate: e.startDate ?? new Date().toISOString(),
    locationCity: e.locationCity ?? e.location?.city ?? 'Montréal',
    coverImage: e.coverImage,
    eventType: e.eventType ?? 'Événement',
    status: e.status ?? 'published',
    minPrice: e.minPrice,
  };
}

interface FeaturedSectionProps {
  events: RawFeaturedEvent[];
}

export function FeaturedSection({ events }: FeaturedSectionProps) {
  if (!events?.length) return null;

  return (
    <section className="cinematic-section">
      <div className="container-public">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Sélection</span>
            <h2 className="section-title">Événements à la une</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginTop: 6 }}>
              Les moments les plus attendus cette saison à Montréal.
            </p>
          </div>
          <Link href="/evenements?featured=true" className="link-voir-tout">
            Voir tout →
          </Link>
        </div>
        <div className="featured-grid">
          {events.slice(0, 3).map((event) => (
            <EventCard key={event._id ?? event.id} event={normalize(event)} variant="featured" />
          ))}
        </div>
      </div>
    </section>
  );
}

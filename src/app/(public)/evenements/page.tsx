import type { Metadata } from 'next';
import { HeroSection } from '@/components/public/HeroSection';
import { FeaturedSection } from '@/components/public/FeaturedSection';
import { CategoriesSection } from '@/components/public/CategoriesSection';
import { WeeklySection } from '@/components/public/WeeklySection';
import { EventsCatalogContent } from '@/components/public/EventsCatalogContent';
import type { EventCardData } from '@/components/events/EventCard';
import { buildCatalogQuery } from '@/features/catalog/catalog-filters';
import { fetchCatalogJson } from '@/server/catalog/catalog-api';
import type { MediaImageSource } from '@/shared/types/media.types';

export const metadata: Metadata = {
  title: 'Événements à Montréal',
  description:
    'Découvrez les concerts, galas, conférences et ateliers à Montréal. ' +
    'Achetez vos billets directement sur Elintys.',
};

export const revalidate = 60;

interface RawPublicEvent {
  _id: string;
  title: string;
  slug?: string;
  startDate?: string;
  createdAt?: string;
  location?: { city?: string };
  coverImage?: MediaImageSource;
  eventType?: string;
  status?: string;
  minPrice?: number;
}

interface EventsResponse {
  data?: RawPublicEvent[];
  items?: RawPublicEvent[];
  total?: number;
}

interface CategoryCountsResponse {
  data?: Array<{ category: string; count: number }>;
  total?: number;
}

function normalizeEvent(event: RawPublicEvent): EventCardData {
  return {
    _id: event._id,
    title: event.title,
    slug: event.slug ?? event._id,
    startDate: event.startDate ?? event.createdAt ?? new Date(0).toISOString(),
    locationCity: event.location?.city ?? 'En ligne',
    coverImage: event.coverImage,
    eventType: event.eventType ?? 'other',
    status: event.status ?? 'published',
    minPrice: event.minPrice,
  };
}

export default async function EvenementsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; page?: string }>;
}) {
  const { category, city, page } = await searchParams;
  const query = buildCatalogQuery({ category, city, page });

  const [featuredResult, eventsResult, categoriesResult] = await Promise.all([
    fetchCatalogJson<{ data?: RawPublicEvent[] } | RawPublicEvent[]>('/discovery/featured'),
    fetchCatalogJson<EventsResponse | RawPublicEvent[]>(`/events?${query.toString()}`),
    fetchCatalogJson<CategoryCountsResponse>('/events/categories'),
  ]);

  const featured = Array.isArray(featuredResult.data)
    ? featuredResult.data
    : featuredResult.data?.data ?? [];
  const rawEvents = Array.isArray(eventsResult.data)
    ? eventsResult.data
    : eventsResult.data?.data ?? eventsResult.data?.items ?? [];
  const total = Array.isArray(eventsResult.data)
    ? eventsResult.data.length
    : eventsResult.data?.total ?? rawEvents.length;
  const categoryCounts = Object.fromEntries(
    (categoriesResult.data?.data ?? []).map(({ category: value, count }) => [value, count]),
  );
  const events = rawEvents.map(normalizeEvent);

  return (
    <>
      <HeroSection eventCount={categoriesResult.data?.total ?? null} />
      <FeaturedSection events={featured as Parameters<typeof FeaturedSection>[0]['events']} />
      <CategoriesSection counts={categoryCounts} hasError={categoriesResult.error} />
      <EventsCatalogContent
        events={events}
        total={total}
        hasError={eventsResult.error}
        initialCategory={category}
        initialCity={city}
      />
      {!category && !city && (
        <WeeklySection events={events.slice(0, 5)} />
      )}
    </>
  );
}

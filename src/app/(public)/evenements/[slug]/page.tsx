import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicEventExperience } from '@/features/events/components/PublicEventExperience';
import type { PublicEventDetail } from '@/features/events/types';
import { getMediaUrl } from '@/shared/lib/media';
import { API_URL } from '@/shared/config/api-url';
import { normalizePublicEventDetail } from '@/features/events/lib/public-event';
import { publicEventCopy as copy } from '@/features/events/i18n/public-event.copy';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.elintys.com';

const getPublicEvent = cache(async (slug: string): Promise<PublicEventDetail | null> => {
  const response = await fetch(`${API_URL}/events/slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('PUBLIC_EVENT_FETCH_FAILED');
  const event = normalizePublicEventDetail(await response.json());
  if (!event) throw new Error('PUBLIC_EVENT_INVALID_RESPONSE');
  return event;
});

function canonicalFor(slug: string): string {
  return new URL(`/evenements/${encodeURIComponent(slug)}`, SITE_URL).toString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let event: PublicEventDetail | null;
  try {
    event = await getPublicEvent(slug);
  } catch {
    return {
      title: copy.errorTitle,
      description: copy.errorDescription,
      robots: { index: false, follow: false },
    };
  }
  if (!event) notFound();

  const description = (event.shortDescription ?? event.description)?.slice(0, 160);
  const canonical = canonicalFor(event.slug);
  const cover = getMediaUrl(event.coverImage);
  const indexable = event.discoverability === 'public';
  return {
    title: event.title,
    description,
    alternates: { canonical },
    robots: { index: indexable, follow: indexable },
    openGraph: {
      type: 'website',
      locale: 'fr_CA',
      siteName: 'Elintys',
      title: event.title,
      description,
      url: canonical,
      ...(cover ? { images: [{ url: cover, alt: event.title }] } : {}),
    },
    twitter: {
      card: cover ? 'summary_large_image' : 'summary',
      title: event.title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function EventSlugPage({ params }: Props) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const canonical = canonicalFor(event.slug);
  const cover = getMediaUrl(event.coverImage);
  const structuredData = event.discoverability === 'public'
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        startDate: event.startDate,
        ...(event.endDate ? { endDate: event.endDate } : {}),
        ...(event.description || event.shortDescription
          ? { description: event.description ?? event.shortDescription }
          : {}),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: event.location?.type === 'online'
          ? 'https://schema.org/OnlineEventAttendanceMode'
          : event.location?.type === 'hybrid'
            ? 'https://schema.org/MixedEventAttendanceMode'
            : 'https://schema.org/OfflineEventAttendanceMode',
        ...(event.location?.type !== 'online' && (event.venue?.name || event.location?.name)
          ? {
              location: {
                '@type': 'Place',
                name: event.venue?.name ?? event.location?.name,
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: event.venue?.address.street ?? event.location?.address,
                  addressLocality: event.venue?.address.city ?? event.location?.city,
                  addressRegion: event.venue?.address.province ?? event.location?.province,
                  postalCode: event.venue?.address.postalCode ?? event.location?.postalCode,
                },
              },
            }
          : {}),
        ...(event.organizer ? { organizer: { '@type': 'Organization', name: event.organizer.name } } : {}),
        ...(cover ? { image: [cover] } : {}),
        url: canonical,
        ...(event.ticketTypes.length > 0
          ? {
              offers: event.ticketTypes.map((ticket) => ({
                '@type': 'Offer',
                name: ticket.name,
                price: (ticket.price / 100).toFixed(2),
                priceCurrency: 'CAD',
                availability: ticket.quantity > ticket.sold
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/SoldOut',
                url: `${canonical}#billets`,
              })),
            }
          : {}),
      }
    : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />
      )}
      <PublicEventExperience event={event} />
    </>
  );
}

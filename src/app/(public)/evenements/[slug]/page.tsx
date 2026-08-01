import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EventPageClient } from '@/features/events/components/EventPageClient';
import { API_URL } from '@/shared/config/api-url';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/events/slug/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Événement introuvable — Elintys' };
    const event = await res.json() as { title: string; description?: string; discoverability?: 'public' | 'unlisted' };
    return {
      title: `${event.title} — Elintys`,
      description: event.description?.slice(0, 160),
      robots: event.discoverability === 'unlisted'
        ? { index: false, follow: false }
        : { index: true, follow: true },
    };
  } catch {
    return { title: 'Événement — Elintys' };
  }
}

export default async function EventSlugPage({ params }: Props) {
  const { slug } = await params;

  const eventRes = await fetch(`${API_URL}/events/slug/${slug}`, { next: { revalidate: 60 } });
  if (!eventRes.ok) notFound();

  const event = await eventRes.json();

  // Fetch ticket types using the event _id
  const ticketsRes = await fetch(
    `${API_URL}/ticket-types/events/${event._id}`,
    { next: { revalidate: 30 } },
  );
  const ticketTypes = ticketsRes.ok ? await ticketsRes.json() : [];

  const structuredData = event.discoverability === 'public'
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        description: event.description,
        eventAttendanceMode: event.location?.type === 'online'
          ? 'https://schema.org/OnlineEventAttendanceMode'
          : 'https://schema.org/OfflineEventAttendanceMode',
        location: event.location?.name
          ? { '@type': 'Place', name: event.location.name, address: event.location.address }
          : undefined,
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
      <EventPageClient event={event} ticketTypes={ticketTypes} />
    </>
  );
}

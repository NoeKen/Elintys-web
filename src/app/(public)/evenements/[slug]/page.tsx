import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EventPageClient } from '@/features/events/components/EventPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/events/slug/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Événement introuvable — Elintys' };
    const event = await res.json() as { title: string; description?: string };
    return {
      title: `${event.title} — Elintys`,
      description: event.description?.slice(0, 160),
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
    `${API_URL}/tickets/types?eventId=${event._id}`,
    { next: { revalidate: 30 } },
  );
  const ticketTypes = ticketsRes.ok ? await ticketsRes.json() : [];

  return <EventPageClient event={event} ticketTypes={ticketTypes} />;
}

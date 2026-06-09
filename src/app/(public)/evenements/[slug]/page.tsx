import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EventHero } from '@/components/public/EventHero';
import { EventAbout } from '@/components/public/EventAbout';
import { EventLocation } from '@/components/public/EventLocation';
import { EventOrganizer } from '@/components/public/EventOrganizer';
import { ProgramTimeline } from '@/components/public/ProgramTimeline';
import { TicketSelector } from '@/components/public/TicketSelector';

export const revalidate = 300;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface ProgramItem {
  time: string;
  title: string;
  description?: string;
}

interface PublicEventDetail {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  eventType?: string;
  startDate?: string;
  attendeesCount?: number;
  location?: {
    city?: string;
    address?: string;
    postalCode?: string;
    country?: string;
  };
  program?: ProgramItem[];
  organizer?: {
    name?: string;
    avatar?: string;
    description?: string;
  };
}

interface TicketType {
  _id: string;
  name: string;
  description?: string;
  price: number;
  availableQuantity: number;
  totalQuantity: number;
}

async function getEvent(id: string): Promise<PublicEventDetail | null> {
  const res = await fetch(`${API_URL}/events/${id}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json() as Promise<PublicEventDetail>;
}

async function getTicketTypes(eventId: string): Promise<TicketType[]> {
  const res = await fetch(`${API_URL}/ticket-types/event/${eventId}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data: unknown = await res.json();
  if (Array.isArray(data)) return data as TicketType[];
  const obj = data as { data?: TicketType[] };
  return obj?.data ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  return {
    title: event ? `${event.title} — Elintys` : 'Événement — Elintys',
    description: event?.description?.substring(0, 160) ?? '',
    openGraph: {
      images: event?.coverImage ? [{ url: event.coverImage }] : [],
    },
  };
}

export default async function EventPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const ticketTypes = await getTicketTypes(event._id);

  return (
    <>
      <EventHero event={event} />

      <div className="container-public event-layout">
        <main className="event-main">
          <EventAbout description={event.description} />
          {event.program && event.program.length > 0 && (
            <ProgramTimeline items={event.program} />
          )}
          <EventLocation location={event.location} />
          <EventOrganizer organizer={event.organizer} />
        </main>
        <aside className="event-sidebar">
          <TicketSelector eventId={event._id} ticketTypes={ticketTypes} />
        </aside>
      </div>
    </>
  );
}

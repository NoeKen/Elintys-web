import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  EventCard,
  type EventCardData,
  EventCardSkeleton,
} from "@/components/events/EventCard";
import { cn } from "@/shared/lib/utils";

export const metadata: Metadata = {
  title: "Événements à Montréal",
  description:
    "Découvrez les concerts, galas, conférences et mariages à Montréal. " +
    "Achetez vos billets directement sur Elintys.",
};

export const revalidate = 60;

interface EventsPageProps {
  searchParams: Promise<{
    q?: string;
    ville?: string;
    categorie?: string;
    page?: string;
  }>;
}

interface EventsResponse {
  items: EventCardData[];
  total: number;
  page: number;
  limit: number;
}

interface RawEvent {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  startDate?: string;
  location?: {
    city?: string;
  };
  locationCity?: string;
  coverImage?: string;
  eventType?: string;
  status?: string;
  minPrice?: number;
}

interface RawEventsResponse {
  items?: RawEvent[];
  data?: RawEvent[];
  total?: number;
  page?: number;
  limit?: number;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
}

const CATEGORIES = [
  { label: "Tous", value: "" },
  { label: "Conférence", value: "conference" },
  { label: "Gala", value: "gala" },
  { label: "Concert", value: "concert" },
  { label: "Mariage", value: "mariage" },
  { label: "Atelier", value: "atelier" },
  { label: "Sport", value: "sport" },
] as const;

function normalizeEvent(event: RawEvent): EventCardData {
  const id = event._id ?? event.id ?? event.slug ?? event.title ?? "event";

  return {
    _id: id,
    title: event.title ?? "Événement",
    slug: event.slug ?? id,
    startDate: event.startDate ?? new Date().toISOString(),
    locationCity: event.locationCity ?? event.location?.city ?? "Montréal",
    coverImage: event.coverImage,
    eventType: event.eventType ?? "Événement",
    status: event.status ?? "published",
    minPrice: event.minPrice,
  };
}

function normalizeEventsResponse(payload: RawEventsResponse): EventsResponse {
  const rawItems = payload.items ?? payload.data ?? [];
  const total = payload.total ?? payload.meta?.total ?? rawItems.length;
  const page = payload.page ?? payload.meta?.page ?? 1;
  const limit = payload.limit ?? payload.meta?.perPage ?? 12;

  return {
    items: rawItems.map(normalizeEvent),
    total,
    page,
    limit,
  };
}

async function fetchEvents(
  params: Awaited<EventsPageProps["searchParams"]>
): Promise<EventsResponse> {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/events`
  );

  url.searchParams.set("status", "published");
  url.searchParams.set("visibility", "public");
  url.searchParams.set("page", params.page ?? "1");
  url.searchParams.set("limit", "12");

  if (params.ville) url.searchParams.set("city", params.ville);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return { items: [], total: 0, page: 1, limit: 12 };
  }

  const payload = (await res.json()) as RawEventsResponse;
  const response = normalizeEventsResponse(payload);

  if (!params.q && !params.categorie) return response;

  const query = params.q?.trim().toLowerCase();
  const category = params.categorie?.trim().toLowerCase();
  const filteredItems = response.items.filter((event) => {
    const matchesQuery = query
      ? event.title.toLowerCase().includes(query) ||
        event.locationCity.toLowerCase().includes(query)
      : true;
    const matchesCategory = category
      ? event.eventType.toLowerCase() === category
      : true;

    return matchesQuery && matchesCategory;
  });

  return {
    ...response,
    items: filteredItems,
    total: filteredItems.length,
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const { items: events, total } = await fetchEvents(params);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="mb-2 font-serif text-4xl font-bold text-primary">
          Événements à Montréal
        </h1>
        <p className="text-sm text-on-surface-variant">
          {total} événement{total > 1 ? "s" : ""} disponible
          {total > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => {
          const isActive =
            params.categorie === category.value ||
            (!params.categorie && category.value === "");

          return (
            <Link
              key={category.value}
              href={
                category.value
                  ? `/evenements?categorie=${category.value}`
                  : "/evenements"
              }
              className={cn(
                "flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-outline-variant bg-surface text-primary hover:bg-background"
              )}
            >
              {category.label}
            </Link>
          );
        })}
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        }
      >
        {events.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 text-center"
            data-testid="events-empty-state"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-background">
              <span className="font-serif text-4xl text-primary" aria-hidden="true">
                E
              </span>
            </div>
            <h2 className="mb-2 font-serif text-2xl font-bold text-primary">
              Aucun événement trouvé
            </h2>
            <p className="max-w-sm text-sm text-on-surface-variant">
              Essayez de modifier vos critères ou revenez plus tard.
            </p>
            <Link
              href="/evenements"
              className={cn(
                "mt-6 rounded-md bg-accent px-6 py-2 text-sm font-medium text-white",
                "transition-opacity hover:opacity-90"
              )}
            >
              Voir tous les événements
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </Suspense>
    </div>
  );
}

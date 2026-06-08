import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

export interface EventCardData {
  _id: string;
  title: string;
  slug: string;
  startDate: string;
  locationCity: string;
  coverImage?: string;
  eventType: string;
  status: string;
  minPrice?: number;
}

interface EventCardProps {
  event: EventCardData;
  showFavorite?: boolean;
  className?: string;
}

export function EventCard({
  event,
  showFavorite = true,
  className,
}: EventCardProps) {
  const priceLabel =
    event.minPrice === 0
      ? "Gratuit"
      : event.minPrice !== undefined
        ? `À partir de ${formatCurrency(event.minPrice)}`
        : "—";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-lg border border-outline-variant bg-surface",
        "transition-shadow duration-200 hover:shadow-card",
        className
      )}
      data-testid="event-card"
    >
      <div className="relative h-44 overflow-hidden bg-background">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary">
            <span className="font-serif text-5xl text-white/70" aria-hidden="true">
              E
            </span>
          </div>
        )}

        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-1",
            "bg-primary/90 text-xs font-medium text-white backdrop-blur-sm"
          )}
        >
          {event.eventType}
        </span>

        {showFavorite && (
          <div className="absolute right-3 top-3">
            <FavoriteButton
              targetId={event._id}
              targetType="event"
              size="sm"
            />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3
          className={cn(
            "mb-2 line-clamp-2 text-sm font-semibold leading-snug text-primary",
            "transition-colors group-hover:text-accent"
          )}
        >
          {event.title}
        </h3>

        <div className="mb-3 flex flex-col gap-1 text-xs text-on-surface-variant">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <time dateTime={event.startDate}>
              {formatDate(event.startDate, { time: false })}
            </time>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {event.locationCity}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-amber">{priceLabel}</span>
          <Link
            href={`/evenements/${event.slug}`}
            className={cn(
              "rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white",
              "transition-opacity hover:opacity-90"
            )}
            data-testid="event-card-link"
          >
            Voir
          </Link>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-lg border border-outline-variant bg-surface"
      aria-hidden="true"
    >
      <div className="h-44 bg-background" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded-md bg-background" />
        <div className="h-3 w-1/2 rounded-md bg-background" />
        <div className="h-3 w-2/3 rounded-md bg-background" />
        <div className="mt-4 flex justify-between">
          <div className="h-4 w-1/4 rounded-md bg-background" />
          <div className="h-7 w-16 rounded-md bg-background" />
        </div>
      </div>
    </div>
  );
}

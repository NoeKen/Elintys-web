import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

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

export type EventCardVariant = 'default' | 'featured' | 'compact' | 'list';

interface EventCardProps {
  event: EventCardData;
  showFavorite?: boolean;
  className?: string;
  variant?: EventCardVariant;
}

export function EventCard({
  event,
  showFavorite = true,
  className,
  variant = 'default',
}: EventCardProps) {
  const priceLabel =
    event.minPrice === 0
      ? 'Gratuit'
      : event.minPrice !== undefined
        ? `À partir de ${formatCurrency(event.minPrice)}`
        : '—';

  const href = `/evenements/${event.slug}`;

  if (variant === 'list') {
    return (
      <article
        className={cn(
          'group flex items-center gap-4 rounded-xl border border-outline-variant/70 bg-white/80 p-3',
          'shadow-[var(--shadow-soft-line)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-float',
          className
        )}
        data-testid="event-card"
      >
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-background">
          {event.coverImage ? (
            <Image src={event.coverImage} alt={event.title} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary">
              <span className="font-serif text-lg text-white/70" aria-hidden="true">E</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-on-surface">{event.title}</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">{event.locationCity}</p>
        </div>
        <Link
          href={href}
          className="flex-shrink-0 text-sm font-semibold text-accent"
          data-testid="event-card-link"
        >
          Voir →
        </Link>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article
        className={cn(
          'group flex items-center gap-3 rounded-xl border border-outline-variant/70 bg-white/80 p-3',
          'shadow-[var(--shadow-soft-line)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-float',
          className
        )}
        data-testid="event-card"
      >
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-background">
          {event.coverImage ? (
            <Image src={event.coverImage} alt={event.title} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary">
              <span className="font-serif text-xl text-white/70" aria-hidden="true">E</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-on-surface">{event.title}</h3>
          <p className="mt-1 text-xs text-on-surface-variant">
            {formatDate(event.startDate, { time: false })}
          </p>
        </div>
        <Link
          href={href}
          className="flex-shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-soft-line)] transition duration-300 hover:-translate-y-0.5 hover:shadow-float"
          data-testid="event-card-link"
        >
          Découvrir
        </Link>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article
        className={cn(
          'premium-card group overflow-hidden',
          'transition duration-500 ease-out hover:-translate-y-1 hover:shadow-premium',
          className
        )}
        data-testid="event-card"
      >
        <div className="relative overflow-hidden bg-background" style={{ aspectRatio: '16/9' }}>
          {event.coverImage ? (
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              unoptimized
              className="image-cinematic transition-transform duration-500 group-hover:scale-[1.035]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary">
              <span className="font-serif text-6xl text-white/70" aria-hidden="true">E</span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-primary/70 px-2.5 py-1 text-xs font-semibold text-white shadow-[var(--shadow-soft-line)] backdrop-blur-md">
            {event.eventType}
          </span>
          {showFavorite && (
            <div className="absolute right-3 top-3">
              <FavoriteButton targetId={event._id} targetType="event" size="sm" />
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="mb-2 font-serif text-xl text-on-surface transition-colors group-hover:text-accent">
            {event.title}
          </h3>
          <div className="mb-4 flex flex-col gap-1 text-xs text-on-surface-variant">
            <p className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              <time dateTime={event.startDate}>{formatDate(event.startDate, { time: false })}</time>
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              {event.locationCity}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-amber">{priceLabel}</span>
            <Link
              href={href}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-soft-line)] transition duration-300 hover:-translate-y-0.5 hover:bg-teal-dark"
              data-testid="event-card-link"
            >
              Voir l&apos;événement
            </Link>
          </div>
        </div>
      </article>
    );
  }

  /* default variant */
  return (
    <article
      className={cn(
        'premium-card group overflow-hidden',
        'transition duration-500 ease-out hover:-translate-y-1 hover:shadow-premium',
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
            className="image-cinematic transition-transform duration-500 group-hover:scale-[1.035]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary">
            <span className="font-serif text-5xl text-white/70" aria-hidden="true">E</span>
          </div>
        )}
        <span
          className={cn(
            'absolute left-3 top-3 rounded-full px-2.5 py-1',
            'border border-white/15 bg-primary/70 text-xs font-semibold text-white shadow-[var(--shadow-soft-line)] backdrop-blur-md'
          )}
        >
          {event.eventType}
        </span>
        {showFavorite && (
          <div className="absolute right-3 top-3">
            <FavoriteButton targetId={event._id} targetType="event" size="sm" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3
          className={cn(
            'mb-2 line-clamp-2 text-sm font-semibold leading-snug text-primary',
            'transition-colors group-hover:text-accent'
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
            href={href}
            className={cn(
              'rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white',
              'shadow-[var(--shadow-soft-line)] transition duration-300 hover:-translate-y-0.5 hover:bg-teal-dark'
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
      className="premium-skeleton overflow-hidden rounded-2xl border border-outline-variant bg-surface"
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

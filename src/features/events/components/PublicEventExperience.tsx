import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
  Star,
  UsersRound,
} from 'lucide-react';
import { EventGallery } from './EventGallery';
import { EventPageClient } from './EventPageClient';
import { eventCreationCopy as wizardCopy } from '@/features/events/i18n/event-creation.copy';
import { publicEventCopy as copy } from '@/features/events/i18n/public-event.copy';
import type { PublicEventDetail, PublicRelatedEvent } from '@/features/events/types';
import { getOptimizedMediaUrl } from '@/shared/lib/media';

const EVENT_TYPE_LABELS: Record<string, string> = {
  conference: 'Conférence',
  wedding: 'Mariage',
  gala: 'Gala',
  concert: 'Concert',
  festival: 'Festival',
  workshop: 'Atelier',
  corporate: 'Événement corporatif',
  birthday: 'Anniversaire',
  networking: 'Réseautage',
  other: 'Événement',
};

function safeDateTime(event: PublicEventDetail): { date: string; time: string; end?: string } {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : undefined;
  const timeZone = event.timezone || 'America/Toronto';
  try {
    return {
      date: new Intl.DateTimeFormat('fr-CA', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone,
      }).format(start),
      time: new Intl.DateTimeFormat('fr-CA', {
        hour: '2-digit', minute: '2-digit', timeZone,
      }).format(start),
      ...(end ? {
        end: new Intl.DateTimeFormat('fr-CA', {
          hour: '2-digit', minute: '2-digit', timeZone,
        }).format(end),
      } : {}),
    };
  } catch {
    return {
      date: new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(start),
      time: new Intl.DateTimeFormat('fr-CA', { timeStyle: 'short' }).format(start),
    };
  }
}

function locationLabel(event: PublicEventDetail): string | undefined {
  if (event.location?.type === 'online') return copy.online;
  const parts = [event.location?.name, event.location?.address, event.location?.city].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

export function PublicEventExperience({ event }: { event: PublicEventDetail }) {
  const dateTime = safeDateTime(event);
  const coverUrl = event.coverImage ? getOptimizedMediaUrl(event.coverImage, 'cover') : undefined;
  const eventLocation = locationLabel(event);
  const formatLabel = event.location?.type === 'online'
    ? copy.online
    : event.location?.type === 'hybrid'
      ? copy.hybrid
      : copy.physical;
  const admissionLabels = event.admissionModes.map((mode) => wizardCopy.identity.admissionOptions[mode]);

  return (
    <article className="public-event-shell">
      <header className="public-event-hero">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Image de couverture — ${event.title}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="public-event-hero-fallback" aria-hidden="true">
            <span>{event.title.slice(0, 1).toLocaleUpperCase('fr-CA')}</span>
          </div>
        )}
        <div className="public-event-hero-scrim" aria-hidden="true" />
        <div className="container-public public-event-hero-content">
          <div className="flex flex-wrap gap-2">
            {event.eventType && <span className="public-event-hero-badge">{EVENT_TYPE_LABELS[event.eventType]}</span>}
            {event.location?.city && <span className="public-event-hero-badge">{event.location.city}</span>}
            {event.discoverability === 'unlisted' && <span className="public-event-hero-badge">Lien privé</span>}
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-[clamp(42px,7vw,86px)] leading-[0.98] text-white [text-wrap:balance]">
            {event.title}
          </h1>
          {event.shortDescription && (
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{event.shortDescription}</p>
          )}
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/90">
            <span className="inline-flex items-center gap-2"><CalendarDays size={17} aria-hidden="true" />{dateTime.date}</span>
            <span className="inline-flex items-center gap-2"><Clock3 size={17} aria-hidden="true" />{dateTime.time}{dateTime.end ? ` – ${dateTime.end}` : ''}</span>
            {eventLocation && <span className="inline-flex items-center gap-2"><MapPin size={17} aria-hidden="true" />{eventLocation}</span>}
          </div>
        </div>
      </header>

      <div className="container-public py-12 sm:py-16 lg:py-20">
        <section aria-labelledby="event-essentials-title">
          <p className="section-eyebrow">{copy.essentials}</p>
          <h2 id="event-essentials-title" className="sr-only">{copy.essentials}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact icon={<CalendarDays />} label={copy.date} value={event.dateIsTentative ? copy.tentative : dateTime.date} detail={`${dateTime.time}${dateTime.end ? ` – ${dateTime.end}` : ''}`} />
            <Fact icon={<MapPin />} label={copy.format} value={formatLabel} detail={event.location?.city} />
            {eventLocation && <Fact icon={<Building2 />} label={copy.place} value={event.location?.name ?? event.location?.city ?? formatLabel} detail={event.location?.address} />}
            {event.capacity ? <Fact icon={<UsersRound />} label={copy.capacity} value={`${event.capacity} personnes`} /> : null}
          </div>
        </section>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <div className="min-w-0 space-y-8">
            {event.description && (
              <section className="public-event-section" aria-labelledby="event-about-title">
                <p className="section-eyebrow">{copy.about}</p>
                <h2 id="event-about-title" className="mt-3 font-serif text-3xl text-navy-dark sm:text-4xl">{copy.about}</h2>
                <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-on-surface-variant">{event.description}</p>
              </section>
            )}

            {event.gallery.length > 0 && (
              <section className="public-event-section" aria-labelledby="event-gallery-title">
                <p className="section-eyebrow">Inspiration</p>
                <h2 id="event-gallery-title" className="mt-3 font-serif text-3xl text-navy-dark sm:text-4xl">{copy.gallery}</h2>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{copy.galleryHint}</p>
                <div className="mt-6"><EventGallery images={event.gallery} title={event.title} /></div>
              </section>
            )}

            {event.venue && (
              <section className="public-event-section" aria-labelledby="event-venue-title">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="section-eyebrow">{copy.place}</p>
                    <h2 id="event-venue-title" className="mt-3 font-serif text-3xl text-navy-dark sm:text-4xl">{event.venue.name}</h2>
                    <p className="mt-3 inline-flex items-start gap-2 text-sm leading-6 text-on-surface-variant">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                      {[event.venue.address.street, event.venue.address.city, event.venue.address.province, event.venue.address.postalCode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  {event.venue.rating > 0 && (
                    <span className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-gold-pale px-4 text-sm font-bold text-gold-dark">
                      <Star size={16} fill="currentColor" aria-hidden="true" />{event.venue.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {event.venue.description && <p className="mt-6 text-base leading-8 text-on-surface-variant">{event.venue.description}</p>}
                {event.venue.amenities.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-navy">{copy.amenities}</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {event.venue.amenities.slice(0, 8).map((amenity) => <li key={amenity} className="public-event-soft-chip">{amenity}</li>)}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {event.providers.length > 0 && (
              <section className="public-event-section" aria-labelledby="event-providers-title">
                <p className="section-eyebrow">Partenaires de l’expérience</p>
                <h2 id="event-providers-title" className="mt-3 font-serif text-3xl text-navy-dark sm:text-4xl">{copy.providers}</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {event.providers.map((provider) => (
                    <article key={provider._id} className="rounded-3xl border border-outline-variant/60 bg-white/70 p-5 shadow-[var(--shadow-soft-line)]">
                      <span className="public-event-provider-mark" aria-hidden="true">{provider.businessName.slice(0, 1)}</span>
                      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-teal-dark">{provider.category}</p>
                      <h3 className="mt-2 font-serif text-2xl text-navy-dark">{provider.businessName}</h3>
                      <p className="mt-2 text-sm text-on-surface-variant">{provider.serviceArea}</p>
                      {provider.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">{provider.description}</p>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {event.organizer && (
              <section className="public-event-organizer" aria-labelledby="event-organizer-title">
                <span className="public-event-organizer-mark" aria-hidden="true">{event.organizer.name.slice(0, 1)}</span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal-dark">{copy.organizer}</p>
                  <h2 id="event-organizer-title" className="mt-1 font-serif text-2xl text-navy-dark">{event.organizer.name}</h2>
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-28" aria-label="Accès et admission">
            <EventPageClient event={event} />
            <div className="mt-4 rounded-3xl border border-white/60 bg-white/55 p-5 text-sm leading-6 text-on-surface-variant backdrop-blur-xl">
              <p className="font-bold text-on-surface">{copy.admission}</p>
              <p className="mt-1">{admissionLabels.join(' · ')}</p>
            </div>
          </aside>
        </div>

        {event.relatedEvents.length > 0 && (
          <section className="mt-16 border-t border-outline-variant/60 pt-12 sm:mt-20 sm:pt-16" aria-labelledby="event-related-title">
            <p className="section-eyebrow">Sélection publique</p>
            <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 id="event-related-title" className="font-serif text-3xl text-navy-dark sm:text-4xl">{copy.related}</h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy.relatedHint}</p>
              </div>
              <Link href="/evenements" className="premium-button-ghost self-start">{copy.backToEvents}<ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {event.relatedEvents.map((related) => <RelatedCard key={related._id} event={related} />)}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function Fact({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail?: string }) {
  return (
    <article className="public-event-fact">
      <span className="public-event-icon-chip" aria-hidden="true">{icon}</span>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
      <p className="mt-2 font-bold leading-6 text-on-surface">{value}</p>
      {detail && <p className="mt-1 text-sm leading-5 text-on-surface-variant">{detail}</p>}
    </article>
  );
}

function RelatedCard({ event }: { event: PublicRelatedEvent }) {
  const cover = event.coverImage ? getOptimizedMediaUrl(event.coverImage, 'card') : undefined;
  const date = new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(event.startDate));
  return (
    <Link href={`/evenements/${event.slug}`} className="group overflow-hidden rounded-3xl border border-outline-variant/60 bg-white/75 shadow-[var(--shadow-float)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-premium)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-navy to-teal-dark">
        {cover ? <Image src={cover} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 25vw" /> : <Sparkles className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/50" aria-hidden="true" />}
      </div>
      <div className="p-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-teal-dark">{date}</p>
        <h3 className="mt-2 font-serif text-2xl leading-tight text-navy-dark">{event.title}</h3>
        {event.location?.city && <p className="mt-3 inline-flex items-center gap-2 text-sm text-on-surface-variant"><MapPin size={14} aria-hidden="true" />{event.location.city}</p>}
      </div>
    </Link>
  );
}

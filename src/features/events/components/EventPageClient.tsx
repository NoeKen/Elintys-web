'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CalendarDays, Image as ImageIcon, MapPin, Ticket, UsersRound } from 'lucide-react';
import { PurchaseModal } from '@/components/tickets/PurchaseModal';
import { cn } from '@/shared/lib/utils';
import type { MediaImageSource } from '@/shared/types/media.types';
import { getOptimizedMediaUrl } from '@/shared/lib/media';
import api from '@/shared/lib/api';
import { eventCreationCopy as copy } from '@/features/events/i18n/event-creation.copy';
import { getUserFacingError } from '@/shared/lib/user-facing-error';

interface TicketType {
  _id: string;
  name: string;
  price: number; // in cents
  isFree: boolean;
  quantity: number;
  sold: number;
  description?: string;
}

interface EventLocation {
  type: 'physical' | 'online' | 'hybrid';
  address?: string;
  city?: string;
  onlineUrl?: string;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  coverImage?: MediaImageSource;
  gallery?: Array<MediaImageSource>;
  eventType?: string;
  capacity?: number;
  startDate: string;
  endDate?: string;
  location?: EventLocation;
  slug?: string;
  status: string;
  discoverability: 'public' | 'unlisted' | 'private';
  accessPolicy: {
    type: 'open' | 'registration_required' | 'access_code' | 'email_domain' | 'manual_approval' | 'guest_list' | 'invitation_token';
    hasAccessCode?: boolean;
    allowedDomains?: string[];
  };
  admissionModes: Array<'free' | 'registration_only' | 'free_ticket' | 'paid_ticket' | 'invitation'>;
}

interface Props {
  event: Event;
  ticketTypes: TicketType[];
}

export function EventPageClient({ event, ticketTypes }: Props) {
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [accessGrant, setAccessGrant] = useState<string>();
  const [policyAuthorized, setPolicyAuthorized] = useState(false);
  const [accessFeedback, setAccessFeedback] = useState<string>();
  const [accessLoading, setAccessLoading] = useState(false);
  const coverUrl = event.coverImage
    ? getOptimizedMediaUrl(event.coverImage, 'cover')
    : undefined;

  const startDate = new Date(event.startDate).toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const policyType = event.accessPolicy?.type ?? 'open';
  const ticketAccessAllowed = policyType === 'open'
    || policyType === 'registration_required'
    || Boolean(accessGrant)
    || policyAuthorized;

  const handleAccessAction = async () => {
    setAccessLoading(true);
    setAccessFeedback(undefined);
    try {
      if (policyType === 'access_code') {
        const response = await api.post<{ authorized: true; accessGrant: string }>(
          `/events/${event._id}/access/code/verify`,
          { code: accessCode },
        );
        setAccessGrant(response.data.accessGrant);
        setAccessFeedback(copy.identity.codeVerified);
      } else if (policyType === 'email_domain') {
        const response = await api.post<{ authorized: boolean; reason: string }>(
          `/events/${event._id}/access/domain/check`,
          {},
        );
        if (response.data.authorized) {
          setPolicyAuthorized(true);
          setAccessFeedback(copy.identity.domainVerified);
        } else {
          setPolicyAuthorized(false);
          setAccessFeedback(copy.identity.domainDenied);
        }
      } else if (policyType === 'manual_approval') {
        await api.post(`/events/${event._id}/access/request`, {});
        setAccessFeedback(copy.identity.requestSent);
      }
    } catch (error: unknown) {
      setAccessFeedback(getUserFacingError(error, { fallback: copy.identity.accessActionError }).message);
    } finally {
      setAccessLoading(false);
    }
  };

  return (
    <main className="public-detail-shell mesh-gradient">
      <div className="container-public">
        <article className="public-detail-hero">
          <div className="public-detail-cover">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={event.title}
                fill
                className="image-cinematic"
                sizes="(max-width: 768px) 100vw, 1200px"
                priority
              />
            ) : (
              <div className="flex min-h-[inherit] items-center justify-center">
                <span className="font-serif text-7xl text-white/70" aria-hidden="true">E</span>
              </div>
            )}
          </div>

          <div className="public-detail-body">
            <div className="mb-6 flex flex-wrap gap-3 text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-white/70 px-3 py-2 shadow-[var(--shadow-soft-line)]">
                <CalendarDays className="h-4 w-4 text-teal" aria-hidden="true" />
                {startDate}
              </span>
              {event.location?.city && (
                <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-white/70 px-3 py-2 shadow-[var(--shadow-soft-line)]">
                  <MapPin className="h-4 w-4 text-teal" aria-hidden="true" />
                  {event.location.address ? `${event.location.address}, ` : ''}{event.location.city}
                </span>
              )}
            </div>

            <h1 className="premium-heading mb-5 max-w-3xl">{event.title}</h1>

            {event.description && (
              <p className="premium-subtitle mb-10 whitespace-pre-wrap">
                {event.description}
              </p>
            )}

            <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Informations clés">
              <PublicFact icon={<CalendarDays size={18} />} label="Date" value={startDate} />
              <PublicFact icon={<MapPin size={18} />} label="Format" value={event.location?.type === 'online' ? 'En ligne' : event.location?.city ?? 'Lieu à confirmer'} />
              <PublicFact icon={<UsersRound size={18} />} label="Capacité" value={event.capacity ? `${event.capacity} personnes` : 'À confirmer'} />
            </section>

            <section className="premium-card mb-6 p-5 sm:p-6">
              <p className="section-eyebrow mb-3">{copy.identity.publicAccessTitle}</p>
              <h2 className="font-serif text-2xl text-on-surface">
                {copy.identity.publicAccessDescriptions[policyType]}
              </h2>

              {policyType === 'access_code' && !accessGrant && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <label className="sr-only" htmlFor="public-event-access-code">{copy.identity.accessCode}</label>
                  <input
                    id="public-event-access-code"
                    type="password"
                    value={accessCode}
                    onChange={(event) => setAccessCode(event.target.value)}
                    className="event-input flex-1"
                    placeholder={copy.identity.accessCodePlaceholder}
                  />
                  <button type="button" onClick={handleAccessAction} disabled={accessLoading || accessCode.length < 6} className="premium-button px-6 py-3 disabled:opacity-50">
                    {copy.identity.publicCtas.enterCode}
                  </button>
                </div>
              )}

              {policyType === 'email_domain' && (
                <button type="button" onClick={handleAccessAction} disabled={accessLoading} className="premium-button mt-5 px-6 py-3 disabled:opacity-50">
                  {copy.identity.publicCtas.verifyEmail}
                </button>
              )}

              {policyType === 'manual_approval' && (
                <button type="button" onClick={handleAccessAction} disabled={accessLoading} className="premium-button mt-5 px-6 py-3 disabled:opacity-50">
                  {copy.identity.publicCtas.request}
                </button>
              )}

              {policyType === 'registration_required' && (
                <a href="/inscription/etape-1" className="premium-button mt-5 inline-flex px-6 py-3">{copy.identity.publicCtas.register}</a>
              )}

              {policyType === 'invitation_token' && (
                <a href="/invitation" className="premium-button mt-5 inline-flex px-6 py-3">{copy.identity.publicCtas.useInvitation}</a>
              )}

              {accessFeedback && <p className="mt-4 text-sm font-medium text-event-petrol" role="status">{accessFeedback}</p>}
            </section>

            <section className="premium-card p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="section-eyebrow mb-3">Billetterie</p>
                  <h2 className="font-serif text-2xl text-on-surface">Billets disponibles</h2>
                </div>
                <div className="hidden h-11 w-11 items-center justify-center rounded-full bg-teal-pale text-teal sm:flex">
                  <Ticket className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              {ticketTypes.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  Aucun billet disponible pour cet événement.
                </p>
              ) : (
                <div className="space-y-3">
                  {ticketTypes.map((tt) => {
                    const available = tt.quantity - tt.sold;
                    return (
                      <div key={tt._id} className="ticket-card">
                        <div>
                          <p className="font-semibold text-on-surface">{tt.name}</p>
                          {tt.description && (
                            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                              {tt.description}
                            </p>
                          )}
                          <p className={cn('mt-2 text-sm', available === 0 ? 'text-destructive' : 'text-on-surface-variant')}>
                            {available === 0 ? 'Complet' : `${available} disponible${available > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-lg font-bold text-navy">
                            {tt.isFree ? 'Gratuit' : `${(tt.price / 100).toFixed(2)} $`}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(tt)}
                            disabled={available === 0 || !ticketAccessAllowed}
                            className={cn(
                              'mt-3 min-h-10 rounded-full px-5 text-sm font-bold transition duration-300',
                              available === 0 || !ticketAccessAllowed
                                ? 'cursor-not-allowed border border-outline-variant bg-surface-low text-on-surface-variant'
                                : 'premium-button px-5 py-2',
                            )}
                          >
                            {available === 0 ? 'Complet' : 'Choisir'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {event.gallery && event.gallery.length > 0 ? (
              <section className="premium-card mt-6 p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-pale text-terracotta-dark"><ImageIcon size={18} aria-hidden="true" /></span><div><p className="section-eyebrow">Inspiration</p><h2 className="mt-1 font-serif text-2xl text-on-surface">L’univers de l’événement</h2></div></div>
                <div className="grid auto-rows-[170px] gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {event.gallery.slice(0, 6).map((image, index) => <div key={`${getOptimizedMediaUrl(image, 'card')}-${index}`} className={cn('relative overflow-hidden rounded-2xl', index === 0 && 'sm:row-span-2')}><Image src={getOptimizedMediaUrl(image, 'card')} alt={`Ambiance de ${event.title} — image ${index + 1}`} fill className="object-cover transition-transform duration-500 hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" /></div>)}
                </div>
              </section>
            ) : null}
          </div>
        </article>
      </div>

      {selectedTicket && (
        <PurchaseModal
          ticketType={selectedTicket}
          eventTitle={event.title}
          accessGrant={accessGrant}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </main>
  );
}

function PublicFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-outline-variant/60 bg-white/70 p-4"><span className="text-teal" aria-hidden="true">{icon}</span><p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p><p className="mt-1 text-sm font-semibold text-on-surface">{value}</p></div>;
}

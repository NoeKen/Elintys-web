'use client';

import Image from 'next/image';
import {
  
  
  
  
  
  
  Check
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  eventCreationCopy as copy,
  formatEventCreationCopy
} from '@/features/events/i18n/event-creation.copy';
import {
  
  type VenueProfile
} from '@/features/venues/services/venue-profile.service';

export function VenueCard({
  venue,
  selected,
  onSelect
}: {
  venue: VenueProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-3xl border bg-white transition-shadow',
        selected
          ? 'border-event-gold shadow-event-selected'
          : 'border-event-outline-subtle/60 shadow-event-soft',
      )}
    >
      {venue.photos[0] ? (
        <div className="relative aspect-[16/8]">
          <Image
            src={venue.photos[0]}
            alt={venue.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
      <div className="p-5">
        <span className="rounded-full bg-event-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-event-petrol">
          {copy.venue.elintysBadge}
        </span>
        <h3 className="mt-3 font-serif text-xl text-event-petrol">{venue.name}</h3>
        <p className="mt-1 text-sm text-event-muted">
          {venue.address.city}, {venue.address.province}
        </p>
        <p className="mt-2 text-xs text-event-muted">
          {formatEventCreationCopy(copy.venue.capacity, {
            count: venue.capacity
          })}
        </p>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            'mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold',
            selected
              ? 'border-event-petrol bg-event-petrol text-white'
              : 'border-event-outline-subtle text-event-petrol',
          )}
        >
          {selected ? copy.venue.selected : copy.venue.select}
          {selected && <Check className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </article>
  );
}

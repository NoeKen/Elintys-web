'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  
  
  
  
  
  
  
  
  
  Clock3,
  
  
  
  
  
  
  
  
  
  Search
  
  
  
  
  
  
  
} from 'lucide-react';
import type {
  
  
  UseFormReturn
} from 'react-hook-form';
import { cn } from '@/shared/lib/utils';
import {
  eventCreationCopy as copy,
  formatEventCreationCopy
} from '@/features/events/i18n/event-creation.copy';
import {
  
  
  type EventCreationFormValues
  
  
  
  
} from '@/features/events/lib/event-creation';
import {
  venueProfileService,
  type VenueProfile
} from '@/features/venues/services/venue-profile.service';
import { FieldError } from '../components/FieldError';
import { FilterChips } from '../components/FilterChips';
import { Label } from '../components/Label';
import { ManualVenueFields } from '../components/ManualVenueFields';
import { StepHeading } from '../components/StepHeading';
import { VenueCard } from '../components/VenueCard';

interface VenueStepProps {
  form: UseFormReturn<EventCreationFormValues>;
}

export function VenueStep({ form }: VenueStepProps) {
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const venueMode = form.watch('venueMode');
  const venueChoice = form.watch('venueChoice');
  const venueProfile = form.watch('venueProfile');
  const region = form.watch('venueSearchRegion').toLocaleLowerCase('fr-CA');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['venue-catalog', 1, 24],
    queryFn: () => venueProfileService.list(1, 24),
    staleTime: 60_000
  });
  const venues = useMemo(() => {
    const needle =
      venueMode === 'search' ? region : catalogSearch.toLocaleLowerCase('fr-CA');
    return (data?.data ?? []).filter((venue) => {
      if (!needle) return true;
      return `${venue.name} ${venue.address.city}`
        .toLocaleLowerCase('fr-CA')
        .includes(needle);
    });
  }, [catalogSearch, data?.data, region, venueMode]);

  const selectVenue = (venue: VenueProfile) => {
    form.setValue('venueChoice', 'catalog', { shouldDirty: true });
    form.setValue('venueProfile', venue._id, {
      shouldDirty: true,
      shouldValidate: true
    });
    form.setValue('venueName', venue.name);
    form.setValue('venueCity', venue.address.city);
  };

  if (venueMode === 'later') {
    return (
      <section className="py-12 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-event-teal/10 text-event-teal">
          <Clock3 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mx-auto mt-8 max-w-2xl font-serif text-[clamp(2rem,5vw,3.25rem)] leading-tight text-event-petrol">
          {copy.venue.deferredTitle}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-event-muted">
          {copy.venue.deferredCopy}
        </p>
      </section>
    );
  }

  const isSearch = venueMode === 'search';
  const venueTypes = Object.entries(copy.venue.types);
  const amenities = Object.entries(copy.venue.amenityLabels);

  return (
    <section>
      <StepHeading
        eyebrow={isSearch ? copy.venue.searchEyebrow : copy.venue.existingEyebrow}
        title={isSearch ? copy.venue.searchTitle : copy.venue.existingTitle}
        subtitle={isSearch ? copy.venue.searchSubtitle : copy.venue.existingSubtitle}
      />

      {!isSearch && (
        <div className="mb-7 grid grid-cols-2 gap-3">
          {[
            ['catalog', copy.venue.savedVenue],
            ['manual', copy.venue.manualVenue],
          ].map(([value, label]) => (
            <label
              key={value}
              className={cn(
                'flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-4 text-center text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                venueChoice === value
                  ? 'border-event-gold bg-white shadow-event-selected'
                  : 'border-transparent bg-event-surface',
              )}
            >
              <input
                type="radio"
                value={value}
                {...form.register('venueChoice')}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      )}

      {!isSearch && venueChoice === 'manual' ? (
        <ManualVenueFields
          register={form.register}
          errors={form.formState.errors}
        />
      ) : (
        <>
          <div className={cn('grid gap-6', isSearch && 'lg:grid-cols-[250px_1fr]')}>
            <div className={cn('rounded-3xl bg-event-surface p-5', !isSearch && 'contents')}>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-event-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={isSearch ? form.watch('venueSearchRegion') : catalogSearch}
                  onChange={(event) =>
                    isSearch
                      ? form.setValue('venueSearchRegion', event.target.value)
                      : setCatalogSearch(event.target.value)
                  }
                  className="event-input pl-11"
                  placeholder={
                    isSearch
                      ? copy.venue.regionPlaceholder
                      : copy.venue.searchPlaceholder
                  }
                  aria-label={copy.venue.search}
                />
              </div>
              {isSearch && (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="venue-radius">{copy.venue.radius}</Label>
                      <input
                        id="venue-radius"
                        type="number"
                        {...form.register('venueSearchRadius')}
                        className="event-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="venue-search-capacity">
                        {copy.venue.desiredCapacity}
                      </Label>
                      <input
                        id="venue-search-capacity"
                        type="number"
                        {...form.register('venueSearchCapacity')}
                        className="event-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="venue-budget" optional>
                      {copy.venue.budget}
                    </Label>
                    <input
                      id="venue-budget"
                      type="number"
                      {...form.register('venueSearchBudget')}
                      className="event-input"
                    />
                  </div>
                  <FilterChips
                    title={copy.venue.venueTypes}
                    entries={venueTypes}
                    selected={selectedTypes}
                    onChange={setSelectedTypes}
                  />
                  <FilterChips
                    title={copy.venue.amenities}
                    entries={amenities}
                    selected={selectedAmenities}
                    onChange={setSelectedAmenities}
                  />
                </div>
              )}
            </div>

            <div>
              {isSearch && (
                <p className="mb-4 text-sm font-semibold text-event-muted">
                  {formatEventCreationCopy(copy.venue.results, {
                    count: venues.length
                  })}
                </p>
              )}
              {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="premium-skeleton h-56 rounded-3xl"
                    />
                  ))}
                </div>
              )}
              {isError && (
                <p className="rounded-2xl bg-destructive/5 p-5 text-sm text-destructive">
                  {copy.venue.catalogError}
                </p>
              )}
              {!isLoading && !isError && venues.length === 0 && (
                <p className="rounded-2xl bg-event-surface p-8 text-center text-sm text-event-muted">
                  {copy.venue.noResults}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {venues.map((venue) => (
                  <VenueCard
                    key={venue._id}
                    venue={venue}
                    selected={venueProfile === venue._id}
                    onSelect={() => selectVenue(venue)}
                  />
                ))}
              </div>
              <FieldError
                message={form.formState.errors.venueProfile?.message}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

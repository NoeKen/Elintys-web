'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AudioLines,
  BriefcaseBusiness,
  Cake,
  CalendarDays,
  Camera,
  Car,
  Check,
  ChefHat,
  CirclePlus,
  Clock3,
  FerrisWheel,
  Globe2,
  Heart,
  LampDesk,
  Lightbulb,
  MapPin,
  Mic2,
  Music2,
  PartyPopper,
  Search,
  ShieldCheck,
  Sparkles,
  Theater,
  UsersRound,
  Video,
  Wrench,
  X,
} from 'lucide-react';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormReturn,
} from 'react-hook-form';
import { cn } from '@/shared/lib/utils';
import {
  eventCreationCopy as copy,
  formatEventCreationCopy,
} from '@/features/events/i18n/event-creation.copy';
import {
  EVENT_TYPES,
  PROVIDER_CATEGORIES,
  type EventCreationFormValues,
  type EventCreationStep,
  type ManualProviderDraft,
  type ProviderCategory,
  type ProviderNeedState,
} from '@/features/events/lib/event-creation';
import {
  venueProfileService,
  type VenueProfile,
} from '@/features/venues/services/venue-profile.service';
import { vendorsService } from '@/features/vendors/services/vendors.service';
import type { MediaImage, MediaImageSource } from '@/shared/types/media.types';
import type { EventMediaState } from '@/features/events/services/event-media.service';
import type { EventPublishReadiness } from '@/features/events/services/events.service';
import { EventMediaManager } from './EventMediaManager';

const EVENT_TYPE_ICONS: Record<
  EventCreationFormValues['eventType'],
  LucideIcon
> = {
  conference: UsersRound,
  wedding: Heart,
  gala: Theater,
  concert: Music2,
  festival: FerrisWheel,
  workshop: Wrench,
  corporate: BriefcaseBusiness,
  birthday: Cake,
  networking: Globe2,
  other: CirclePlus,
};

const PROVIDER_ICONS: Record<ProviderCategory, LucideIcon> = {
  photographer: Camera,
  videographer: Video,
  caterer: ChefHat,
  dj: Music2,
  musician: Mic2,
  decorator: Sparkles,
  host: PartyPopper,
  sound: AudioLines,
  lighting: LampDesk,
  security: ShieldCheck,
  transport: Car,
  equipment: Wrench,
  other: CirclePlus,
};

const FEATURED_PROVIDER_IMAGES: Partial<Record<ProviderCategory, string>> = {
  caterer: '/images/event-creation/provider-catering.jpg',
  photographer: '/images/event-creation/provider-photography.jpg',
  dj: '/images/event-creation/provider-dj.jpg',
  decorator: '/images/event-creation/provider-decoration.jpg',
};

interface StepHeadingProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

function StepHeading({ eyebrow, title, subtitle }: StepHeadingProps) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-event-teal">
        {eyebrow}
      </p>
      <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em] text-event-petrol">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-event-muted">
        {subtitle}
      </p>
    </div>
  );
}

function FieldError({
  message,
  id,
}: {
  message?: string;
  id?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-xs font-semibold text-destructive" role="alert">
      {message}
    </p>
  );
}

function Label({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.1em] text-event-ink"
    >
      {children}
      {optional && (
        <span className="font-medium normal-case tracking-normal text-event-muted">
          {copy.optional}
        </span>
      )}
    </label>
  );
}

interface InformationStepProps {
  form: UseFormReturn<EventCreationFormValues>;
}

export function InformationStep({ form }: InformationStepProps) {
  const selectedType = form.watch('eventType');
  const errors = form.formState.errors;

  return (
    <section>
      <StepHeading
        eyebrow={copy.information.eyebrow}
        title={copy.information.title}
        subtitle={copy.information.subtitle}
      />

      <div className="space-y-9">
        <div>
          <Label htmlFor="event-title">{copy.information.name}</Label>
          <input
            id="event-title"
            {...form.register('title')}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'event-title-error' : undefined}
            className="event-input text-lg"
            placeholder={copy.information.namePlaceholder}
          />
          <FieldError
            id="event-title-error"
            message={errors.title?.message}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-event-ink">
            {copy.information.type}
          </legend>
          <p className="mb-4 text-sm text-event-muted">
            {copy.information.typeHint}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {EVENT_TYPES.map((type) => {
              const Icon = EVENT_TYPE_ICONS[type];
              const selected = selectedType === type;
              return (
                <label
                  key={type}
                  className={cn(
                    'group relative flex min-h-28 cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                    selected
                      ? 'border-event-gold bg-white shadow-event-selected'
                      : 'border-transparent bg-event-surface hover:-translate-y-0.5 hover:bg-white hover:shadow-event-soft motion-reduce:transform-none',
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    {...form.register('eventType')}
                    className="sr-only"
                  />
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      selected ? 'text-event-gold' : 'text-event-petrol',
                    )}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold leading-5 text-event-ink">
                    {copy.information.types[type]}
                  </span>
                </label>
              );
            })}
          </div>
          <FieldError message={errors.eventType?.message} />
        </fieldset>

        <div className="grid gap-5 md:grid-cols-[1fr_240px]">
          <div>
            <Label htmlFor="short-description" optional>
              {copy.information.shortDescription}
            </Label>
            <textarea
              id="short-description"
              {...form.register('shortDescription')}
              className="event-textarea"
              placeholder={copy.information.shortDescriptionPlaceholder}
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="capacity" optional>
              {copy.information.attendance}
            </Label>
            <div className="rounded-2xl bg-event-petrol p-5 text-white shadow-event-soft">
              <input
                id="capacity"
                type="number"
                min={1}
                inputMode="numeric"
                {...form.register('capacity')}
                aria-invalid={Boolean(errors.capacity)}
                className="w-full border-0 bg-transparent text-center font-serif text-4xl outline-none placeholder:text-white/35"
                placeholder="100"
              />
              <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
                {copy.information.attendanceHint}
              </p>
            </div>
            <FieldError message={errors.capacity?.message} />
          </div>
        </div>
      </div>
    </section>
  );
}

interface ScheduleStepProps {
  form: UseFormReturn<EventCreationFormValues>;
}

export function ScheduleStep({ form }: ScheduleStepProps) {
  const errors = form.formState.errors;
  const format = form.watch('format');
  const venueMode = form.watch('venueMode');
  const dateIsTentative = form.watch('dateIsTentative');
  const formats = [
    { value: 'physical' as const, Icon: MapPin },
    { value: 'hybrid' as const, Icon: UsersRound },
    { value: 'online' as const, Icon: Video },
  ];
  const venueModes = [
    { value: 'existing' as const, Icon: MapPin },
    { value: 'search' as const, Icon: Search },
    { value: 'later' as const, Icon: Clock3 },
  ];

  return (
    <section>
      <StepHeading
        eyebrow={copy.schedule.eyebrow}
        title={copy.schedule.title}
        subtitle={copy.schedule.subtitle}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <fieldset className="rounded-3xl bg-event-surface p-5 sm:p-7">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-event-ink">
            <CalendarDays className="h-4 w-4 text-event-teal" aria-hidden="true" />
            {copy.schedule.calendar}
          </legend>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">{copy.schedule.startDate}</Label>
              <input
                id="start-date"
                type="date"
                {...form.register('startDate')}
                disabled={dateIsTentative}
                className="event-input disabled:opacity-45"
              />
              <FieldError message={errors.startDate?.message} />
            </div>
            <div>
              <Label htmlFor="start-time">{copy.schedule.startTime}</Label>
              <input
                id="start-time"
                type="time"
                {...form.register('startTime')}
                disabled={dateIsTentative}
                className="event-input disabled:opacity-45"
              />
            </div>
            <div>
              <Label htmlFor="end-date" optional>
                {copy.schedule.endDate}
              </Label>
              <input
                id="end-date"
                type="date"
                {...form.register('endDate')}
                disabled={dateIsTentative}
                className="event-input disabled:opacity-45"
              />
              <FieldError message={errors.endDate?.message} />
            </div>
            <div>
              <Label htmlFor="end-time" optional>
                {copy.schedule.endTime}
              </Label>
              <input
                id="end-time"
                type="time"
                {...form.register('endTime')}
                disabled={dateIsTentative}
                className="event-input disabled:opacity-45"
              />
            </div>
          </div>
          <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 border-t border-event-outline-subtle/60 pt-5 text-sm text-event-ink">
            <input
              type="checkbox"
              {...form.register('dateIsTentative')}
              className="event-checkbox"
            />
            {copy.schedule.dateTentative}
          </label>
        </fieldset>

        <div className="rounded-3xl border border-event-outline-subtle/60 bg-white/70 p-6 shadow-event-soft">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-event-muted">
            {copy.schedule.timezone}
          </p>
          <p className="mt-3 font-serif text-xl text-event-petrol">
            {copy.schedule.timezoneValue}
          </p>
          <div className="mt-8 rounded-2xl bg-event-petrol p-5 text-white">
            <Lightbulb className="h-5 w-5 text-event-gold" aria-hidden="true" />
            <p className="mt-4 text-sm italic leading-6 text-white/80">
              {copy.expertCopy}
            </p>
          </div>
        </div>
      </div>

      <fieldset className="mt-9">
        <legend className="mb-4 text-sm font-semibold text-event-ink">
          {copy.schedule.format}
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {formats.map(({ value, Icon }) => (
            <label
              key={value}
              className={cn(
                'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                format === value
                  ? 'border-event-gold bg-white shadow-event-selected'
                  : 'border-transparent bg-event-surface',
              )}
            >
              <input
                type="radio"
                value={value}
                {...form.register('format')}
                className="sr-only"
              />
              <Icon className="h-5 w-5 text-event-teal" aria-hidden="true" />
              <span className="font-semibold">{copy.schedule.formats[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="mb-4 font-serif text-2xl text-event-petrol">
          {copy.schedule.venueQuestion}
        </legend>
        <div className="grid gap-4 md:grid-cols-3">
          {venueModes.map(({ value, Icon }) => {
            const content = copy.schedule.venueModes[value];
            return (
              <label
                key={value}
                className={cn(
                  'relative flex min-h-44 cursor-pointer flex-col rounded-3xl border p-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                  venueMode === value
                    ? 'border-event-gold bg-white shadow-event-selected'
                    : 'border-transparent bg-event-surface',
                )}
              >
                <input
                  type="radio"
                  value={value}
                  {...form.register('venueMode')}
                  className="sr-only"
                />
                <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-event-background text-event-teal">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-event-ink">{content.label}</span>
                <span className="mt-2 text-sm leading-6 text-event-muted">
                  {content.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}

function VenueCard({
  venue,
  selected,
  onSelect,
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
            count: venue.capacity,
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

function ManualVenueFields({
  register,
  errors,
}: {
  register: UseFormRegister<EventCreationFormValues>;
  errors: FieldErrors<EventCreationFormValues>;
}) {
  const fields = [
    ['venueName', copy.venue.name],
    ['venueAddress', copy.venue.address],
    ['venueCity', copy.venue.city],
    ['venueProvince', copy.venue.province],
    ['venuePostalCode', copy.venue.postalCode],
    ['venueContactName', copy.venue.contactName],
    ['venueContactPhone', copy.venue.phone],
    ['venueContactEmail', copy.venue.email],
  ] as const;
  return (
    <div className="rounded-3xl bg-event-surface p-5 sm:p-7">
      <p className="mb-6 text-sm text-event-muted">{copy.venue.manualNote}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([name, label], index) => (
          <div key={name} className={index === 1 ? 'sm:col-span-2' : undefined}>
            <Label htmlFor={name} optional={index >= 5}>
              {label}
            </Label>
            <input
              id={name}
              type={name === 'venueContactEmail' ? 'email' : 'text'}
              {...register(name)}
              aria-invalid={Boolean(errors[name])}
              className="event-input"
            />
            <FieldError message={errors[name]?.message} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
    staleTime: 60_000,
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
      shouldValidate: true,
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
                'flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border px-4 text-center text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
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
                    count: venues.length,
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

function FilterChips({
  title,
  entries,
  selected,
  onChange,
}: {
  title: string;
  entries: Array<[string, string]>;
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-event-ink">
        {title}
      </legend>
      <div className="flex flex-wrap gap-2">
        {entries.map(([value, label]) => (
          <label
            key={value}
            className={cn(
              'cursor-pointer rounded-full px-3 py-2 text-xs font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
              selected.includes(value)
                ? 'bg-event-petrol text-white'
                : 'bg-white text-event-muted',
            )}
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() =>
                onChange(
                  selected.includes(value)
                    ? selected.filter((item) => item !== value)
                    : [...selected, value],
                )
              }
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export type ManualProviderMap = Partial<
  Record<ProviderCategory, ManualProviderDraft>
>;
export type SelectedVendorMap = Partial<Record<ProviderCategory, string>>;

interface ProvidersStepProps {
  providerNeeds: ProviderNeedState[];
  onProviderNeedsChange: (needs: ProviderNeedState[]) => void;
  manualProviders: ManualProviderMap;
  onManualProvidersChange: (providers: ManualProviderMap) => void;
  selectedVendors: SelectedVendorMap;
  onSelectedVendorsChange: (vendors: SelectedVendorMap) => void;
}

export function ProvidersStep({
  providerNeeds,
  onProviderNeedsChange,
  manualProviders,
  onManualProvidersChange,
  selectedVendors,
  onSelectedVendorsChange,
}: ProvidersStepProps) {
  const { data: vendorData } = useQuery({
    queryKey: ['vendor-catalog', 1, 20],
    queryFn: () => vendorsService.list(1, 20),
    staleTime: 60_000,
  });

  const toggleCategory = (category: ProviderCategory) => {
    const exists = providerNeeds.some((item) => item.category === category);
    onProviderNeedsChange(
      exists
        ? providerNeeds.filter((item) => item.category !== category)
        : [...providerNeeds, { category, mode: 'later' }],
    );
  };
  const setMode = (
    category: ProviderCategory,
    mode: ProviderNeedState['mode'],
  ) => {
    onProviderNeedsChange(
      providerNeeds.map((item) =>
        item.category === category ? { ...item, mode } : item,
      ),
    );
  };
  const featured = ['caterer', 'photographer', 'dj', 'decorator'] as const;

  return (
    <section>
      <StepHeading
        eyebrow={copy.providers.eyebrow}
        title={copy.providers.title}
        subtitle={copy.providers.subtitle}
      />

      <fieldset>
        <legend className="sr-only">{copy.providers.title}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((category) => {
            const selected = providerNeeds.some(
              (item) => item.category === category,
            );
            const Icon = PROVIDER_ICONS[category];
            return (
              <label
                key={category}
                className={cn(
                  'group relative aspect-[16/8] cursor-pointer overflow-hidden rounded-3xl border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                  selected ? 'border-event-gold' : 'border-transparent',
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleCategory(category)}
                  className="sr-only"
                />
                <Image
                  src={FEATURED_PROVIDER_IMAGES[category] ?? ''}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-event-petrol/90 via-event-petrol/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {copy.providers.categories[category]}
                    </span>
                    <span className="mt-2 block text-xs uppercase tracking-[0.12em] text-white/70">
                      {copy.providers.categoryTaglines[category]}
                    </span>
                  </span>
                  {selected && (
                    <Check className="h-5 w-5 text-event-gold" aria-hidden="true" />
                  )}
                </span>
              </label>
            );
          })}
        </div>

        <p className="my-6 text-center text-xs font-bold uppercase tracking-[0.16em] text-event-muted">
          {copy.providers.otherNeeds}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {PROVIDER_CATEGORIES.filter(
            (category) => !featured.includes(category as (typeof featured)[number]),
          ).map((category) => {
            const selected = providerNeeds.some(
              (item) => item.category === category,
            );
            const Icon = PROVIDER_ICONS[category];
            return (
              <label
                key={category}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                  selected
                    ? 'bg-event-petrol text-white'
                    : 'bg-event-surface text-event-muted',
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleCategory(category)}
                  className="sr-only"
                />
                <Icon className="h-4 w-4" aria-hidden="true" />
                {copy.providers.categories[category]}
              </label>
            );
          })}
        </div>
      </fieldset>

      {providerNeeds.length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl text-event-petrol">
            {copy.providers.selectionPrompt}
          </h2>
          {providerNeeds.map((need) => {
            const draft = manualProviders[need.category] ?? {
              name: '',
              category: need.category,
              email: '',
              phone: '',
              invite: false,
            };
            const compatibleVendors = (vendorData?.data ?? []).filter(
              (vendor) =>
                need.category === 'other' ||
                vendor.category.includes(
                  need.category === 'photographer'
                    ? 'photographe'
                    : need.category === 'caterer'
                      ? 'traiteur'
                      : need.category === 'decorator'
                        ? 'decorateur'
                        : need.category,
                ),
            );
            return (
              <div
                key={need.category}
                className="rounded-3xl border border-event-outline-subtle/60 bg-white/70 p-5 shadow-event-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-event-ink">
                    {copy.providers.categories[need.category]}
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleCategory(need.category)}
                    aria-label={copy.identity.remove}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-event-muted hover:bg-event-surface focus-visible:outline-2 focus-visible:outline-event-gold"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(['elintys', 'manual', 'later'] as const).map((mode) => (
                    <label
                      key={mode}
                      className={cn(
                        'flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-xs font-semibold focus-within:outline-2 focus-within:outline-event-gold',
                        need.mode === mode
                          ? 'border-event-gold bg-event-surface text-event-petrol'
                          : 'border-event-outline-subtle/60 text-event-muted',
                      )}
                    >
                      <input
                        type="radio"
                        name={`provider-${need.category}`}
                        checked={need.mode === mode}
                        onChange={() => setMode(need.category, mode)}
                        className="sr-only"
                      />
                      {mode === 'elintys'
                        ? copy.providers.find
                        : mode === 'manual'
                          ? copy.providers.manual
                          : copy.providers.later}
                    </label>
                  ))}
                </div>

                {need.mode === 'elintys' && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {compatibleVendors.length === 0 ? (
                      <p className="text-sm text-event-muted">
                        {copy.venue.noResults}
                      </p>
                    ) : (
                      compatibleVendors.slice(0, 4).map((vendor) => (
                        <button
                          key={vendor._id}
                          type="button"
                          onClick={() =>
                            onSelectedVendorsChange({
                              ...selectedVendors,
                              [need.category]: vendor._id,
                            })
                          }
                          className={cn(
                            'rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-event-gold',
                            selectedVendors[need.category] === vendor._id
                              ? 'border-event-gold bg-event-surface'
                              : 'border-event-outline-subtle/60',
                          )}
                        >
                          <span className="font-semibold text-event-ink">
                            {vendor.businessName}
                          </span>
                          <span className="mt-1 block text-xs text-event-muted">
                            {vendor.serviceArea}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {need.mode === 'manual' && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {(['name', 'email', 'phone'] as const).map((field) => (
                      <div key={field} className={field === 'name' ? 'sm:col-span-2' : undefined}>
                        <Label htmlFor={`${need.category}-${field}`} optional={field !== 'name'}>
                          {field === 'name'
                            ? copy.providers.name
                            : field === 'email'
                              ? copy.providers.email
                              : copy.providers.phone}
                        </Label>
                        <input
                          id={`${need.category}-${field}`}
                          type={field === 'email' ? 'email' : 'text'}
                          value={draft[field]}
                          onChange={(event) =>
                            onManualProvidersChange({
                              ...manualProviders,
                              [need.category]: {
                                ...draft,
                                [field]: event.target.value,
                              },
                            })
                          }
                          className="event-input"
                        />
                      </div>
                    ))}
                    <label className="sm:col-span-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-event-ink">
                      <input
                        type="checkbox"
                        checked={draft.invite}
                        disabled={!draft.email}
                        onChange={(event) =>
                          onManualProvidersChange({
                            ...manualProviders,
                            [need.category]: {
                              ...draft,
                              invite: event.target.checked,
                            },
                          })
                        }
                        className="event-checkbox"
                      />
                      <span>
                        {copy.providers.invite}
                        <span className="block text-xs text-event-muted">
                          {copy.providers.inviteHint}
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface IdentityAccessStepProps {
  form: UseFormReturn<EventCreationFormValues>;
  eventId: string;
  coverImage?: MediaImageSource;
  gallery: MediaImage[];
  onMediaStateChange: (state: EventMediaState) => void;
  onCoverPreviewChange: (value?: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}

export function IdentityAccessStep({
  form,
  eventId,
  coverImage,
  gallery,
  onMediaStateChange,
  onCoverPreviewChange,
  onUploadingChange,
}: IdentityAccessStepProps) {
  const discoverability = form.watch('discoverability');
  const accessPolicyType = form.watch('accessPolicyType');
  const admissionModes = form.watch('admissionModes');
  const visibilityOptions = [
    {
      value: 'public' as const,
      Icon: Globe2,
      content: copy.identity.public,
    },
    {
      value: 'unlisted' as const,
      Icon: UsersRound,
      content: copy.identity.unlisted,
    },
    {
      value: 'private' as const,
      Icon: ShieldCheck,
      content: copy.identity.private,
    },
  ];
  const accessOptions = [
    'open',
    'registration_required',
    'access_code',
    'email_domain',
    'manual_approval',
    'guest_list',
    'invitation_token',
  ] as const;
  const admissionOptions = [
    'free',
    'registration_only',
    'free_ticket',
    'paid_ticket',
    'invitation',
  ] as const;

  return (
    <section>
      <StepHeading
        eyebrow={copy.identity.eyebrow}
        title={copy.identity.title}
        subtitle={copy.identity.subtitle}
      />

      <EventMediaManager
        eventId={eventId}
        coverImage={coverImage}
        gallery={gallery}
        onMediaStateChange={onMediaStateChange}
        onCoverPreviewChange={onCoverPreviewChange}
        onUploadingChange={onUploadingChange}
      />

      <div className="mt-12 border-t border-event-outline-subtle/70 pt-10">
        <Label htmlFor="event-description" optional>
          {copy.identity.description}
        </Label>
        <textarea
          id="event-description"
          {...form.register('description')}
          className="event-textarea min-h-40"
          placeholder={copy.identity.descriptionPlaceholder}
        />
      </div>

      <fieldset className="mt-10">
        <legend className="font-serif text-2xl text-event-petrol">
          {copy.identity.visibilityQuestion}
        </legend>
        <p className="mt-2 text-sm text-event-muted">
          {copy.identity.visibilityHint}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {visibilityOptions.map(({ value, Icon, content }) => (
            <label
              key={value}
              className={cn(
                'flex min-h-64 cursor-pointer flex-col rounded-3xl border p-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
                discoverability === value
                  ? 'border-event-petrol bg-event-petrol text-white shadow-event-selected'
                  : 'border-transparent bg-event-surface text-event-ink',
              )}
            >
              <input
                type="radio"
                value={value}
                {...form.register('discoverability')}
                className="sr-only"
              />
              <Icon
                className={cn(
                  'h-6 w-6',
                  discoverability === value ? 'text-event-gold' : 'text-event-teal',
                )}
                aria-hidden="true"
              />
              <span className="mt-8 font-semibold">{content.label}</span>
              <span
                className={cn(
                  'mt-2 text-sm leading-6',
                  discoverability === value ? 'text-white/75' : 'text-event-muted',
                )}
              >
                {content.description}
              </span>
              <span
                className={cn(
                  'mt-auto pt-5 text-xs leading-5',
                  discoverability === value ? 'text-white/65' : 'text-event-muted',
                )}
              >
                {content.help}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8 rounded-3xl border border-event-outline-subtle/70 bg-white/70 p-5 shadow-event-soft sm:p-7">
        <legend className="px-1 font-serif text-2xl text-event-petrol">
          {copy.identity.accessQuestion}
        </legend>
        <p className="mt-2 text-sm text-event-muted">{copy.identity.accessHint}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {accessOptions.map((value) => (
            <label
              key={value}
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition',
                accessPolicyType === value
                  ? 'border-event-gold bg-event-petrol text-white shadow-event-selected'
                  : 'border-event-outline-subtle bg-event-surface text-event-ink',
              )}
            >
              <input type="radio" value={value} {...form.register('accessPolicyType')} className="sr-only" />
              <span className={cn('h-2.5 w-2.5 rounded-full', accessPolicyType === value ? 'bg-event-gold' : 'bg-event-teal/40')} />
              {copy.identity.accessOptions[value]}
            </label>
          ))}
        </div>

        {accessPolicyType === 'access_code' && (
          <div className="mt-5">
            <Label htmlFor="event-access-code">{copy.identity.accessCode}</Label>
            <input
              id="event-access-code"
              type="password"
              autoComplete="new-password"
              {...form.register('accessCodeValue')}
              className="event-input"
              placeholder={copy.identity.accessCodePlaceholder}
            />
            <p className="mt-2 text-xs text-event-muted">{copy.identity.accessCodeHint}</p>
            <FieldError message={form.formState.errors.accessCodeValue?.message} />
          </div>
        )}

        {accessPolicyType === 'email_domain' && (
          <div className="mt-5">
            <Label htmlFor="allowed-domains">{copy.identity.emailDomain}</Label>
            <input
              id="allowed-domains"
              {...form.register('allowedDomains')}
              className="event-input"
              placeholder={copy.identity.emailDomainPlaceholder}
              aria-invalid={Boolean(form.formState.errors.allowedDomains)}
            />
            <p className="mt-2 text-xs text-event-muted">{copy.identity.emailDomainHint}</p>
            <FieldError message={form.formState.errors.allowedDomains?.message} />
          </div>
        )}
      </fieldset>

      <fieldset className="mt-8 rounded-3xl bg-event-surface p-5 sm:p-7">
        <legend className="px-1 font-serif text-2xl text-event-petrol">
          {copy.identity.admissionQuestion}
        </legend>
        <p className="mt-2 text-sm text-event-muted">{copy.identity.admissionHint}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {admissionOptions.map((value) => (
            <label key={value} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 text-sm font-semibold text-event-ink">
              <input
                type="checkbox"
                value={value}
                {...form.register('admissionModes')}
                className="event-checkbox"
              />
              <span>{copy.identity.admissionOptions[value]}</span>
            </label>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-event-teal/10 px-4 py-3 text-xs text-event-petrol">
          {copy.identity.admissionExample}
        </p>
        <FieldError message={form.formState.errors.admissionModes?.message} />
        <span className="sr-only">{admissionModes.join(', ')}</span>
      </fieldset>
    </section>
  );
}

interface ReviewStepProps {
  values: EventCreationFormValues;
  providerNeeds: ProviderNeedState[];
  coverPreview?: string;
  onEdit: (step: EventCreationStep) => void;
  readiness?: EventPublishReadiness;
  readinessLoading?: boolean;
}

export function ReviewStep({
  values,
  providerNeeds,
  coverPreview,
  onEdit,
  readiness,
  readinessLoading,
}: ReviewStepProps) {
  const venue =
    values.venueMode === 'later'
      ? copy.review.noVenue
      : values.venueName || copy.review.noVenue;
  const visibility = copy.identity.discoverabilityLabels[values.discoverability];
  const access = copy.identity.accessOptions[values.accessPolicyType];
  const admission = values.admissionModes
    .map((mode) => copy.identity.admissionOptions[mode])
    .join(' + ');
  const cards = [
    {
      title: copy.review.information,
      step: 1 as const,
      body: `${values.title} · ${copy.information.types[values.eventType]} · ${
        values.capacity || '—'
      }`,
    },
    {
      title: copy.review.date,
      step: 2 as const,
      body: values.dateIsTentative
        ? copy.schedule.dateTentative
        : `${values.startDate} · ${values.startTime} · America/Toronto`,
    },
    { title: copy.review.venue, step: 3 as const, body: venue },
    {
      title: copy.review.providers,
      step: 4 as const,
      body:
        providerNeeds.length > 0
          ? formatEventCreationCopy(copy.review.providersCount, {
              count: providerNeeds.length,
            })
          : copy.review.providersLater,
    },
    {
      title: copy.review.identity,
      step: 5 as const,
      body: coverPreview ? copy.identity.cover : copy.review.noCover,
    },
    { title: copy.review.visibility, step: 5 as const, body: visibility },
    { title: copy.review.access, step: 5 as const, body: access },
    { title: copy.review.admission, step: 5 as const, body: admission },
  ];

  return (
    <section>
      <StepHeading
        eyebrow={copy.review.eyebrow}
        title={copy.review.title}
        subtitle={copy.review.subtitle}
      />

      <div className="rounded-3xl bg-event-surface p-5 sm:p-7">
        <h2 className="font-semibold text-event-ink">{copy.review.checklist}</h2>
        <div className={cn(
          'mt-4 rounded-2xl border px-4 py-4 text-sm',
          readiness?.publishable
            ? 'border-event-teal/30 bg-event-teal/10 text-event-petrol'
            : 'border-event-gold/40 bg-white text-event-ink',
        )}>
          <p className="font-semibold">
            {readinessLoading
              ? copy.review.readinessLoading
              : readiness?.publishable
                ? copy.review.publishReady
                : copy.review.publishNotReady}
          </p>
          {readiness && readiness.errors.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {readiness.errors.map(({ code, field }) => (
                <li key={`${code}:${field}`}>• {copy.review.readinessErrors[code as keyof typeof copy.review.readinessErrors] ?? code}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {[
            copy.review.essential,
            copy.review.dateItem,
            copy.review.visibilityItem,
          ].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full bg-event-teal/10 px-3 py-2 text-xs font-semibold text-event-petrol"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </span>
          ))}
          {[copy.review.venueItem, copy.review.providersItem, copy.review.ticketingItem].map(
            (label) => (
              <span
                key={label}
                className="rounded-full border border-event-outline-subtle bg-white px-3 py-2 text-xs font-semibold text-event-muted"
              >
                {label} · {copy.review.optionalItem}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <article
            key={`${card.title}-${card.step}`}
            className="rounded-3xl border border-event-outline-subtle/60 bg-white/75 p-5 shadow-event-soft"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-serif text-xl text-event-petrol">{card.title}</h3>
              <button
                type="button"
                onClick={() => onEdit(card.step)}
                className="min-h-10 rounded-xl px-3 text-xs font-semibold text-event-teal focus-visible:outline-2 focus-visible:outline-event-gold"
              >
                {copy.modify}
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-event-muted">{card.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-7 rounded-3xl bg-event-petrol p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <Check className="mt-1 h-5 w-5 text-event-gold" aria-hidden="true" />
          <div>
            <p className="font-semibold">{copy.review.allSaved}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              {copy.review.finalHelp}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

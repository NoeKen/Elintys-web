'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  
  
  
  
  
  
  Check,
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  X
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  eventCreationCopy as copy
  
} from '@/features/events/i18n/event-creation.copy';
import {
  
  PROVIDER_CATEGORIES,
  
  
  
  type ProviderCategory,
  type ProviderNeedState
} from '@/features/events/lib/event-creation';
import { vendorsService } from '@/features/vendors/services/vendors.service';
import { Label } from '../components/Label';
import { StepHeading } from '../components/StepHeading';
import {
  
  FEATURED_PROVIDER_IMAGES,
  PROVIDER_ICONS
} from '../components/step-constants';
import type {
  ManualProviderMap,
  SelectedVendorMap
} from '../components/step-types';

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
  onSelectedVendorsChange
}: ProvidersStepProps) {
  const vendorQuery = useQuery({
    queryKey: ['vendor-catalog', 1, 20],
    queryFn: () => vendorsService.list(1, 20),
    staleTime: 60_000
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
                  'group relative aspect-[16/8] cursor-pointer overflow-hidden rounded-3xl focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-event-gold',
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
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
              invite: false
            };
            const compatibleVendors = (vendorQuery.data?.data ?? []).filter(
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
                className="rounded-3xl bg-white/75 p-5 shadow-event-soft"
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
                        'flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-3 text-center text-xs font-semibold focus-within:outline-2 focus-within:outline-event-gold',
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
                    {vendorQuery.isLoading ? (
                      <p className="text-sm text-event-muted" role="status">
                        {copy.providers.catalogLoading}
                      </p>
                    ) : vendorQuery.isError ? (
                      <div className="rounded-2xl bg-terracotta-pale p-4 text-sm text-destructive sm:col-span-2" role="alert">
                        <p>{copy.providers.catalogUnavailable}</p>
                        <button
                          type="button"
                          onClick={() => void vendorQuery.refetch()}
                          disabled={vendorQuery.isFetching}
                          className="mt-3 min-h-11 rounded-full bg-white/80 px-4 font-semibold text-event-petrol disabled:cursor-wait disabled:opacity-50"
                        >
                          {vendorQuery.isFetching ? copy.providers.retrying : copy.providers.retry}
                        </button>
                      </div>
                    ) : compatibleVendors.length === 0 ? (
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
                              [need.category]: vendor._id
                            })
                          }
                          className={cn(
                            'rounded-2xl p-4 text-left shadow-[var(--shadow-soft-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold',
                            selectedVendors[need.category] === vendor._id
                              ? 'bg-teal-pale text-event-petrol shadow-event-soft'
                              : 'bg-white/85 hover:bg-event-surface',
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
                                [field]: event.target.value
                              }
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
                              invite: event.target.checked
                            }
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

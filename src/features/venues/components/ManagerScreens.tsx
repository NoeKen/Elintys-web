'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/shared/hooks/useAuth';
import { authService } from '@/features/auth/client/auth.service';
import { ApiClientError, retryOnTransientError } from '@/shared/lib/api';
import { venueManagerService, type VenueManagerInput } from '../services/venue-manager.service';
import { venueProfileService, type Venue } from '../services/venue-profile.service';
import { venueKeys, invalidateVenueQueries } from '../query-keys';
import { venueCopy, formatVenuePrice, type VenueLocale, type VenueCopy } from '../i18n/venue.copy';

const root = '/tableau-de-bord/gestionnaire';
const button = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-teal px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:opacity-50';
const input = 'min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-teal';
const missing = (error: unknown) => error instanceof ApiClientError && error.status === 404;

function Shell({ title, locale, setLocale, children }: { title: string; locale: VenueLocale; setLocale: (value: VenueLocale) => void; children: ReactNode }) {
  return <section lang={locale} className="mx-auto w-full max-w-4xl space-y-6 px-2 py-6 sm:px-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-serif text-3xl text-navy">{title}</h1>
      <label className="text-sm">{venueCopy[locale].language}<select className={`${input} ml-2 w-auto`} value={locale} onChange={e => setLocale(e.target.value as VenueLocale)}><option value="fr">Français</option><option value="en">English</option></select></label>
    </div>{children}</section>;
}
function Failure({ copy, retry }: { copy: VenueCopy; retry: () => void }) {
  return <div role="alert" className="space-y-3 rounded-xl bg-white p-5 shadow-card"><p>{copy.error}</p><button className={button} onClick={retry}>{copy.retry}</button></div>;
}
type Fields = Record<string, string>;
type FieldSpec = { key: string; label: string; required?: boolean; max?: number; type?: string; min?: number; step?: string; options?: {value: string; label: string}[] };
function EditorForm({ fields, initial, submit, busy, error, success, copy, submitLabel }: { fields: FieldSpec[]; initial: Fields; submit: (values: Fields) => void; busy: boolean; error: boolean; success: boolean; copy: VenueCopy; submitLabel?: string }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Fields>({ defaultValues: initial });
  return <form noValidate onSubmit={handleSubmit(submit)} className="space-y-5 rounded-2xl bg-white p-4 shadow-card sm:p-6">
    <div className="grid gap-5 sm:grid-cols-2">{fields.map(field => <div key={field.key} className={field.key === 'description' ? 'sm:col-span-2' : ''}>
      <label className="mb-2 block text-sm font-medium" htmlFor={field.key}>{field.label}{field.required ? ' *' : ''}</label>
      {field.options ? <select id={field.key} className={input} {...register(field.key)}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input id={field.key} type={field.type ?? 'text'} className={input} min={field.min} step={field.step} maxLength={field.max} aria-required={field.required} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `${field.key}-error` : undefined}
        {...register(field.key, { validate: value => {
          if (!value?.trim()) return !field.required || copy.required;
          if (field.max && value.length > field.max) return copy.invalid;
          if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return copy.invalid;
          if (field.type === 'number' && (!Number.isFinite(Number(value)) || Number(value) < (field.min ?? 0) || (field.step === '1' && !Number.isInteger(Number(value))))) return copy.invalid;
          return true;
        } })} />}
      {errors[field.key] && <p id={`${field.key}-error`} className="mt-1 text-sm text-destructive">{errors[field.key]?.message}</p>}
    </div>)}</div>
    {error && <p role="alert" className="text-destructive">{copy.saveError}</p>}
    {success && <p role="status">{copy.saved}</p>}
    <button className={button} disabled={busy} type="submit">{busy ? copy.saving : submitLabel ?? copy.save}</button>
  </form>;
}
function managerInput(values: Fields): VenueManagerInput {
  return { professionalName: values.professionalName.trim(), description: values.description?.trim() || '', region: values.region?.trim() || '', contactEmail: values.contactEmail?.trim() || undefined, contactPhone: values.contactPhone?.trim() || '' };
}
export function ManagerProfileScreen({ onboarding = false, locale: initialLocale = 'fr' }: { onboarding?: boolean; locale?: VenueLocale }) {
  const [locale, setLocale] = useState(initialLocale); const copy = venueCopy[locale];
  const { user, login } = useAuth(); const router = useRouter(); const client = useQueryClient();
  const query = useQuery({ queryKey: venueKeys.manager(user?.id), queryFn: venueManagerService.getMine, enabled: !onboarding, retry: retryOnTransientError });
  const mutation = useMutation({ mutationFn: async (values: Fields) => {
    const payload = managerInput(values);
    await venueManagerService.save(payload);
    if (onboarding) {
      const session = await authService.saveOnboarding('gestionnaire_salle', { professionalName: payload.professionalName, region: payload.region ?? '' });
      login(session);
    }
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: venueKeys.manager(user?.id) }); if (onboarding) { router.push(`${root}/lieux`); router.refresh(); } } });
  const fields: FieldSpec[] = [
    { key: 'professionalName', label: copy.professionalName, required: true, max: 200 }, { key: 'region', label: copy.region, max: 150 },
    { key: 'contactEmail', label: copy.contactEmail, type: 'email' }, { key: 'contactPhone', label: copy.contactPhone, type: 'tel', max: 30 }, { key: 'description', label: copy.description, max: 3000 },
  ];
  return <Shell title={onboarding ? copy.onboarding : copy.profile} locale={locale} setLocale={setLocale}><p>{copy.intro}</p>
    {!onboarding && query.isLoading ? <p role="status">{copy.loading}</p> : query.isError && !missing(query.error) ? <Failure copy={copy} retry={() => void query.refetch()} /> :
      <EditorForm key={query.data?._id ?? 'new'} fields={fields} initial={{ professionalName: query.data?.professionalName ?? '', region: query.data?.region ?? '', description: query.data?.description ?? '', contactEmail: query.data?.contactEmail ?? user?.email ?? '', contactPhone: query.data?.contactPhone ?? '' }} submit={values => mutation.mutate(values)} busy={mutation.isPending} error={mutation.isError} success={mutation.isSuccess} copy={copy} submitLabel={onboarding ? copy.finish : copy.save} />}
    {!onboarding && <Link className="inline-flex min-h-11 items-center text-teal underline" href={`${root}/lieux`}>{copy.venues}</Link>}
  </Shell>;
}
export function MyVenuesScreen({ locale: initialLocale = 'fr' }: { locale?: VenueLocale }) {
  const [locale, setLocale] = useState(initialLocale); const copy = venueCopy[locale]; const { user } = useAuth();
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: venueKeys.mine(user?.id, page), queryFn: () => venueProfileService.listMine(page), retry: retryOnTransientError });
  return <Shell title={copy.venues} locale={locale} setLocale={setLocale}><Link className={button} href={`${root}/lieux/nouveau`}>{copy.add}</Link>
    {query.isLoading ? <p role="status">{copy.loading}</p> : query.isError ? <Failure copy={copy} retry={() => void query.refetch()} /> : !query.data?.data.length ? <div className="space-y-3 rounded-xl bg-white p-6 shadow-card"><h2 className="font-serif text-2xl">{copy.empty}</h2><p>{copy.emptyBody}</p><Link className="inline-flex min-h-11 items-center text-teal underline" href={`${root}/profil`}>{copy.profile}</Link></div> :
      <ul className="grid gap-5 sm:grid-cols-2">{query.data.data.map(venue => <li key={venue._id} className="min-w-0 space-y-3 rounded-xl bg-white p-5 shadow-card"><h2 className="break-words font-serif text-2xl">{venue.name}</h2><p>{venue.address.city} · {venue.capacity}</p><p>{venue.isActive ? copy.active : copy.inactive}</p><p>{venue.pricePerDay == null ? copy.noPrice : `${formatVenuePrice(venue.pricePerDay, locale)} / ${copy.day}`}</p><Link className={button} aria-label={`${copy.edit} ${venue.name}`} href={`${root}/lieux/${encodeURIComponent(venue._id)}/modifier`}>{copy.edit}</Link>{venue.isActive && <Link className="ml-3 inline-flex min-h-11 items-center text-teal underline" href={`/lieux/${encodeURIComponent(venue._id)}`}>{copy.public}</Link>}</li>)}</ul>}
    {query.data && query.data.total > query.data.limit && <nav aria-label={copy.venues} className="flex flex-wrap items-center gap-4"><button className={button} disabled={page === 1} onClick={() => setPage(page - 1)}>{copy.previous}</button><span role="status">{copy.page} {page}</span><button className={button} disabled={page * query.data.limit >= query.data.total} onClick={() => setPage(page + 1)}>{copy.next}</button></nav>}
  </Shell>;
}
function venueInitial(venue?: Venue): Fields {
  return { type: venue?.type ?? 'other', name: venue?.name ?? '', description: venue?.description ?? '', capacity: venue ? String(venue.capacity) : '', pricePerDay: venue?.pricePerDay == null ? '' : String(venue.pricePerDay), street: venue?.address.street ?? '', city: venue?.address.city ?? '', province: venue?.address.province ?? 'QC', postalCode: venue?.address.postalCode ?? '', contactEmail: venue?.contactEmail ?? '', contactPhone: venue?.contactPhone ?? '' };
}
export function VenueEditorScreen({ venueId, locale: initialLocale = 'fr' }: { venueId?: string; locale?: VenueLocale }) {
  const [locale, setLocale] = useState(initialLocale); const copy = venueCopy[locale]; const { user } = useAuth(); const router = useRouter(); const client = useQueryClient();
  const query = useQuery({ queryKey: venueKeys.detail(user?.id, venueId), queryFn: () => venueProfileService.getMine(venueId!), enabled: !!venueId, retry: retryOnTransientError });
  const manager = useQuery({ queryKey: venueKeys.manager(user?.id), queryFn: venueManagerService.getMine, enabled: !venueId, retry: retryOnTransientError });
  const venue = query.data;
  const mutation = useMutation({ mutationFn: (values: Fields) => {
    const payload = { type: values.type, name: values.name.trim(), description: values.description.trim(), capacity: Number(values.capacity), pricePerDay: values.pricePerDay === '' ? undefined : Number(values.pricePerDay), contactEmail: values.contactEmail.trim() || undefined, contactPhone: values.contactPhone.trim(), address: { street: values.street.trim(), city: values.city.trim(), province: values.province.trim(), postalCode: values.postalCode.trim() } };
    return venueId ? venueProfileService.updateProfile(venueId, payload) : venueProfileService.createProfile(payload);
  }, onSuccess: async () => { await invalidateVenueQueries(client); router.push(`${root}/lieux`); router.refresh(); } });
  const fields: FieldSpec[] = [ { key: 'type', label: copy.type, options: (['conference', 'reception', 'studio', 'restaurant', 'rooftop', 'spectacle', 'other'] as const).map(value => ({ value, label: copy[value] })) }, { key: 'name', label: copy.name, required: true, max: 200 }, { key: 'capacity', label: copy.capacity, required: true, type: 'number', min: 1, step: '1' }, { key: 'pricePerDay', label: copy.pricePerDay, type: 'number', min: 0, step: '1' }, { key: 'street', label: copy.street, required: true, max: 300 }, { key: 'city', label: copy.city, required: true, max: 100 }, { key: 'province', label: copy.province, max: 50 }, { key: 'postalCode', label: copy.postalCode, max: 10 }, { key: 'contactEmail', label: copy.contactEmail, type: 'email' }, { key: 'contactPhone', label: copy.contactPhone, type: 'tel', max: 20 }, { key: 'description', label: copy.description, max: 3000 } ];
  return <Shell title={venueId ? copy.editTitle : copy.add} locale={locale} setLocale={setLocale}><Link className="inline-flex min-h-11 items-center text-teal underline" href={`${root}/lieux`}>{copy.back}</Link>
    {!!venue?.amenities?.length && <section><h2 className="font-serif text-xl">{copy.amenities}</h2><ul>{venue.amenities.map(item => <li key={item}>{item}</li>)}</ul></section>}
    {(venueId ? query.isLoading : manager.isLoading) ? <p role="status">{copy.loading}</p> : !venueId && missing(manager.error) ? <div role="alert"><p>{copy.managerRequired}</p><Link className={button} href={`${root}/profil`}>{copy.profile}</Link></div> : venueId && missing(query.error) ? <p role="alert">{copy.missing}</p> : (venueId ? query.isError : manager.isError) ? <Failure copy={copy} retry={() => void (venueId ? query.refetch() : manager.refetch())} /> : venueId && !venue ? <p role="alert">{copy.missing}</p> :
      <EditorForm key={venueId ?? 'new'} fields={fields} initial={venueInitial(venue)} submit={values => mutation.mutate(values)} busy={mutation.isPending} error={mutation.isError} success={mutation.isSuccess} copy={copy} />}
  </Shell>;
}

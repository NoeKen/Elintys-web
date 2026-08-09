'use client';

import { useDeferredValue, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  Grid2X2,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  OrganizerEventActions,
  OrganizerEventCard,
  StatusBadge,
  formatDate,
  formatLocation,
  getManageHref,
} from '@/components/events/organizer/OrganizerEventCard';
import {
  eventsService,
  type OrganizerEvent,
  type OrganizerEventDate,
  type OrganizerEventProgress,
  type OrganizerEventSort,
  type OrganizerEventView,
} from '@/features/events/services/events.service';
import { getCompletionPercent } from '@/features/events/lib/event-creation';
import {
  organizerCopy,
  organizerEventCopy as copy,
} from '@/features/events/i18n/organizer-event.copy';
import { getOptimizedMediaUrl } from '@/shared/lib/media';
import { ApiClientError } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

type ViewMode = 'grid' | 'list';
type LifecycleStatus = '' | 'draft' | 'published' | 'completed' | 'cancelled';
type EventTypeFilter = '' | keyof typeof copy.types;

interface EventActionHandlers {
  busy: boolean;
  onPublish: (event: OrganizerEvent) => void;
  onArchive: (event: OrganizerEvent) => void;
  onRestore: (event: OrganizerEvent) => void;
  onDelete: (event: OrganizerEvent) => void;
}

const PAGE_SIZE = 12;
const TABS: Array<{ value: OrganizerEventView; label: string }> = [
  { value: 'all', label: copy.events.all },
  { value: 'draft', label: copy.events.drafts },
  { value: 'ready', label: copy.events.ready },
  { value: 'published', label: copy.events.published },
  { value: 'completed', label: copy.events.completed },
  { value: 'archived', label: copy.events.archived },
];

const ACCESS_OPTIONS = [
  ['', copy.events.filterAll],
  ['open', copy.access.openAccess],
  ['registration_required', copy.access.registrationAccess],
  ['access_code', copy.access.codeAccess],
  ['email_domain', copy.access.domainAccess],
  ['manual_approval', copy.access.approvalAccess],
  ['guest_list', copy.access.guestListAccess],
  ['invitation_token', copy.access.inviteOnlyAccess],
] as const;

export function OrganizerEventsExperience() {
  const queryClient = useQueryClient();
  const [display, setDisplay] = useState<ViewMode>('grid');
  const [view, setView] = useState<OrganizerEventView>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<OrganizerEventSort>('updated_desc');
  const [status, setStatus] = useState<LifecycleStatus>('');
  const [eventType, setEventType] = useState<EventTypeFilter>('');
  const [discoverability, setDiscoverability] = useState('');
  const [accessPolicy, setAccessPolicy] = useState('');
  const [progress, setProgress] = useState<'' | OrganizerEventProgress>('');
  const [date, setDate] = useState<'' | OrganizerEventDate>('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string>();
  const deferredSearch = useDeferredValue(search.trim());

  const query = useQuery({
    queryKey: ['my-events', { page, view, search: deferredSearch, sort, status, eventType, discoverability, accessPolicy, progress, date }],
    queryFn: () => eventsService.getMyEvents({
      page,
      limit: PAGE_SIZE,
      view,
      search: deferredSearch || undefined,
      sort,
      status: status || undefined,
      eventType: eventType || undefined,
      discoverability: discoverability || undefined,
      accessPolicy: accessPolicy || undefined,
      progress: progress || undefined,
      date: date || undefined,
    }),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });

  const eventMutation = useMutation({
    mutationFn: async ({ action, event }: { action: 'publish' | 'archive' | 'restore' | 'delete'; event: OrganizerEvent }) => {
      if (action === 'publish') return eventsService.publish(event._id);
      if (action === 'archive') return eventsService.archive(event._id);
      if (action === 'restore') return eventsService.restore(event._id);
      await eventsService.delete(event._id);
      return undefined;
    },
    onMutate: () => setMutationError(undefined),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-events'] }),
        queryClient.invalidateQueries({ queryKey: ['organizer-dashboard-summary'] }),
      ]);
    },
    onError: (error) => {
      const requestId = error instanceof ApiClientError ? error.requestId : undefined;
      setMutationError(requestId ? organizerCopy(copy.dashboard.requestId, { id: requestId }) : copy.events.mutationError);
    },
  });

  const handlers: EventActionHandlers = {
    busy: eventMutation.isPending,
    onPublish: (event) => eventMutation.mutate({ action: 'publish', event }),
    onArchive: (event) => eventMutation.mutate({ action: 'archive', event }),
    onRestore: (event) => eventMutation.mutate({ action: 'restore', event }),
    onDelete: (event) => {
      if (window.confirm(organizerCopy(copy.events.deleteConfirm, { title: event.title }))) {
        eventMutation.mutate({ action: 'delete', event });
      }
    },
  };

  const activeDetailedFilters = [status, eventType, discoverability, accessPolicy, progress, date].filter(Boolean).length;
  const hasFilters = view !== 'all' || Boolean(search.trim()) || activeDetailedFilters > 0;
  const resetPage = () => setPage(1);
  const selectView = (nextView: OrganizerEventView) => {
    setView(nextView);
    setStatus('');
    resetPage();
  };
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextTab = TABS[nextIndex];
    selectView(nextTab.value);
    requestAnimationFrame(() => document.getElementById(`organizer-event-tab-${nextTab.value}`)?.focus());
  };
  const clearFilters = () => {
    setView('all');
    setSearch('');
    setStatus('');
    setEventType('');
    setDiscoverability('');
    setAccessPolicy('');
    setProgress('');
    setDate('');
    setSort('updated_desc');
    setPage(1);
  };

  const events = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.meta.lastPage ?? 1;
  const safePage = Math.min(page, totalPages);
  const requestId = query.error instanceof ApiClientError ? query.error.requestId : undefined;

  return (
    <div className="mx-auto max-w-7xl px-1 py-5 sm:px-3 sm:py-8">
      <header className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-event-panel backdrop-blur-xl sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow mb-4">{copy.events.eyebrow}</p>
            <h1 className="font-serif text-[clamp(2.8rem,7vw,5rem)] leading-none text-event-petrol">{copy.events.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-event-muted">{copy.events.subtitle}</p>
          </div>
          <Link href="/evenements/creer" className="premium-button min-h-12 shrink-0 px-6"><CalendarPlus size={18} aria-hidden="true" />{copy.dashboard.create}</Link>
        </div>
      </header>

      <section className="mt-4 rounded-3xl border border-white/60 bg-white/75 p-4 shadow-event-soft backdrop-blur-xl" aria-label={copy.events.filters}>
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={copy.events.status}>
          {TABS.map((tab, index) => (
            <button id={`organizer-event-tab-${tab.value}`} key={tab.value} type="button" role="tab" aria-selected={view === tab.value} tabIndex={view === tab.value ? 0 : -1} onKeyDown={(event) => handleTabKeyDown(event, index)} onClick={() => selectView(tab.value)} className={cn('min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold', view === tab.value ? 'bg-event-petrol text-white shadow-event-button' : 'bg-event-surface text-event-muted hover:text-event-petrol')}>{tab.label}</button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{copy.events.search}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-event-muted" size={18} aria-hidden="true" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder={copy.events.search} className="h-12 w-full rounded-full border border-event-outline-subtle/70 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-event-gold focus:ring-2 focus:ring-event-gold/20" />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-52">
              <span className="sr-only">{copy.events.newest}</span>
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-event-petrol" size={16} aria-hidden="true" />
              <select value={sort} onChange={(event) => { setSort(event.target.value as OrganizerEventSort); resetPage(); }} className="h-12 w-full appearance-none rounded-full border border-event-outline-subtle/70 bg-white pl-10 pr-9 text-sm font-bold text-event-petrol">
                <option value="updated_desc">{copy.events.newest}</option>
                <option value="date_asc">{copy.events.date}</option>
                <option value="title_asc">{copy.events.titleSort}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-event-muted" size={15} aria-hidden="true" />
            </label>
            <button type="button" aria-expanded={filtersOpen} aria-controls="organizer-event-filters" onClick={() => setFiltersOpen((value) => !value)} className={cn('inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold', filtersOpen || activeDetailedFilters > 0 ? 'border-event-teal bg-teal-pale text-event-petrol' : 'border-event-outline-subtle/70 bg-white text-event-petrol')}>
              <SlidersHorizontal size={16} aria-hidden="true" />{copy.events.filters}{activeDetailedFilters > 0 ? ` · ${activeDetailedFilters}` : ''}
              <span className="sr-only">{filtersOpen ? copy.events.closeFilters : copy.events.openFilters}</span>
            </button>
            <div className="flex min-h-12 rounded-full bg-event-surface p-1" role="group" aria-label={copy.events.displayMode}>
              <ViewButton active={display === 'grid'} label={copy.events.grid} onClick={() => setDisplay('grid')} icon={<Grid2X2 size={16} />} />
              <ViewButton active={display === 'list'} label={copy.events.list} onClick={() => setDisplay('list')} icon={<List size={16} />} />
            </div>
          </div>
        </div>

        {filtersOpen ? (
          <div id="organizer-event-filters" className="mt-4 grid gap-3 border-t border-event-outline-subtle/50 pt-4 sm:grid-cols-2 xl:grid-cols-6">
            <FilterSelect label={copy.events.statusFilter} value={status} onChange={(value) => { setStatus(value as LifecycleStatus); setView('all'); resetPage(); }} options={[
              ['', copy.events.filterAll], ['draft', copy.events.drafts], ['published', copy.events.published], ['completed', copy.events.completed], ['cancelled', copy.events.cancelled],
            ]} />
            <FilterSelect label={copy.events.typeFilter} value={eventType} onChange={(value) => { setEventType(value as EventTypeFilter); resetPage(); }} options={[['', copy.events.filterAll], ...Object.entries(copy.types)]} />
            <FilterSelect label={copy.events.discoverabilityFilter} value={discoverability} onChange={(value) => { setDiscoverability(value); resetPage(); }} options={[
              ['', copy.events.filterAll], ['public', copy.access.publicVisibility], ['unlisted', copy.access.unlistedVisibility], ['private', copy.access.privateVisibility],
            ]} />
            <FilterSelect label={copy.events.accessFilter} value={accessPolicy} onChange={(value) => { setAccessPolicy(value); resetPage(); }} options={ACCESS_OPTIONS} />
            <FilterSelect label={copy.events.progressFilter} value={progress} onChange={(value) => { setProgress(value as '' | OrganizerEventProgress); resetPage(); }} options={[
              ['', copy.events.filterAll], ['incomplete', copy.events.incompleteFilter], ['complete', copy.events.completeFilter],
            ]} />
            <FilterSelect label={copy.events.dateFilter} value={date} onChange={(value) => { setDate(value as '' | OrganizerEventDate); resetPage(); }} options={[
              ['', copy.events.filterAll], ['upcoming', copy.events.upcomingFilter], ['past', copy.events.pastFilter], ['undated', copy.events.undatedFilter],
            ]} />
          </div>
        ) : null}
      </section>

      {mutationError ? <p role="alert" className="mt-4 rounded-2xl border border-destructive/20 bg-terracotta-pale px-4 py-3 text-sm font-semibold text-destructive">{mutationError}</p> : null}
      {query.isFetching && !query.isLoading ? <p className="sr-only" role="status">{copy.events.loading}</p> : null}

      {query.isLoading ? (
        <EventsLoading view={display} />
      ) : query.isError ? (
        <EventsError requestId={requestId} onRetry={() => void query.refetch()} />
      ) : events.length === 0 ? (
        <EventsEmpty filtered={hasFilters} onClear={clearFilters} />
      ) : (
        <>
          {display === 'grid' ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event, index) => <OrganizerEventCard key={event._id} event={event} priority={index === 0} {...handlers} />)}
            </div>
          ) : (
            <EventList events={events} handlers={handlers} />
          )}
          <nav className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/75 px-5 py-4 sm:flex-row" aria-label={copy.events.title}>
            <p className="text-sm text-event-muted">{organizerCopy(copy.events.showing, { from: (safePage - 1) * PAGE_SIZE + 1, to: Math.min(safePage * PAGE_SIZE, total), total })}</p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label={copy.events.previousPage} disabled={safePage === 1 || query.isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex h-11 w-11 items-center justify-center rounded-full bg-event-surface disabled:opacity-35"><ArrowLeft size={16} aria-hidden="true" /></button>
              <span className="min-w-24 text-center text-sm font-bold text-event-petrol">{organizerCopy(copy.events.pageStatus, { page: safePage, total: totalPages })}</span>
              <button type="button" aria-label={copy.events.nextPage} disabled={safePage === totalPages || query.isFetching} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="flex h-11 w-11 items-center justify-center rounded-full bg-event-petrol text-white disabled:opacity-35"><ArrowRight size={16} aria-hidden="true" /></button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

function ViewButton({ active, label, onClick, icon }: { active: boolean; label: string; onClick: () => void; icon: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-event-gold', active ? 'bg-white text-event-petrol shadow-sm' : 'text-event-muted')}>{icon}{label}</button>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string] | [string, string]> }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-event-muted">
      {label}
      <span className="relative">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-event-outline-subtle/70 bg-white px-3 pr-8 text-sm font-semibold normal-case tracking-normal text-event-petrol">
          {options.map(([optionValue, optionLabel]) => <option key={optionValue || 'all'} value={optionValue}>{optionLabel}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={14} aria-hidden="true" />
      </span>
    </label>
  );
}

function EventList({ events, handlers }: { events: OrganizerEvent[]; handlers: EventActionHandlers }) {
  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-event-soft">
      <div className="hidden grid-cols-[minmax(220px,1.7fr)_1fr_0.8fr_1fr_0.8fr_1fr_1fr_auto] gap-4 border-b border-event-outline-subtle/40 bg-event-surface px-6 py-4 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-event-muted xl:grid">
        <span>{copy.events.title}</span><span>{copy.events.date}</span><span>{copy.events.status}</span><span>{copy.events.discoverability}</span><span>{copy.events.access}</span><span>{copy.events.progress}</span><span>{copy.events.modified}</span><span className="sr-only">{copy.events.actions}</span>
      </div>
      {events.map((event) => <EventListRow key={event._id} event={event} handlers={handlers} />)}
    </div>
  );
}

function EventListRow({ event, handlers }: { event: OrganizerEvent; handlers: EventActionHandlers }) {
  const cover = event.coverImage ? getOptimizedMediaUrl(event.coverImage, 'thumbnail') : undefined;
  const progress = getCompletionPercent(event);
  const visibility = event.discoverability === 'private' ? copy.access.privateVisibility : event.discoverability === 'unlisted' ? copy.access.unlistedVisibility : copy.access.publicVisibility;
  const access = accessLabel(event.accessPolicy?.type);
  return (
    <article className="grid gap-4 border-b border-event-outline-subtle/35 p-5 last:border-0 hover:bg-teal-pale/20 xl:grid-cols-[minmax(220px,1.7fr)_1fr_0.8fr_1fr_0.8fr_1fr_1fr_auto] xl:items-center xl:gap-4 xl:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Link href={getManageHref(event)} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-event-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold">
          {cover ? <Image src={cover} alt="" fill className="object-cover" sizes="64px" /> : <span className="flex h-full items-center justify-center font-serif text-2xl text-event-teal">E</span>}
        </Link>
        <span className="min-w-0">
          <Link href={getManageHref(event)} className="block truncate font-serif text-xl text-event-petrol underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold">{event.title}</Link>
          <span className="mt-1 block text-xs font-bold uppercase tracking-[0.08em] text-event-orange">{event.eventType ? copy.types[event.eventType] : copy.types.other}</span>
        </span>
      </div>
      <p className="flex items-center gap-2 text-sm text-event-muted"><CalendarDays size={15} aria-hidden="true" />{formatDate(event.startDate)}</p>
      <span><StatusBadge status={event.status} archived={Boolean(event.archivedAt)} /></span>
      <p className="text-sm font-semibold text-event-muted"><span className="xl:hidden">{copy.events.discoverability} · </span>{visibility}</p>
      <p className="text-sm font-semibold text-event-muted"><span className="xl:hidden">{copy.events.access} · </span>{access}</p>
      <span>
        <span className="text-sm font-bold text-event-petrol">{progress} %</span>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-event-surface"><span className="block h-full rounded-full bg-event-teal" style={{ width: `${progress}%` }} /></span>
      </span>
      <p className="text-sm text-event-muted"><span className="xl:hidden">{copy.events.modified} · </span>{formatDate(event.updatedAt)}</p>
      <div className="flex items-center justify-between gap-3 border-t border-event-outline-subtle/40 pt-4 xl:justify-end xl:border-0 xl:pt-0">
        <p className="flex min-w-0 items-center gap-2 text-sm text-event-muted xl:hidden"><MapPin size={15} aria-hidden="true" />{formatLocation(event)}</p>
        <OrganizerEventActions event={event} compact {...handlers} />
      </div>
    </article>
  );
}

function EventsLoading({ view }: { view: ViewMode }) {
  return <div className={cn('mt-5 grid gap-5', view === 'grid' && 'md:grid-cols-2 xl:grid-cols-3')} role="status" aria-label={copy.events.loading}>{[1,2,3,4,5,6].map((item) => <div key={item} className={cn('premium-skeleton rounded-3xl', view === 'grid' ? 'h-[32rem]' : 'h-28')} />)}</div>;
}

function EventsError({ requestId, onRetry }: { requestId?: string; onRetry: () => void }) {
  return (
    <section className="mt-5 rounded-3xl border border-destructive/20 bg-white/85 p-8 text-center">
      <AlertCircle className="mx-auto text-destructive" size={36} aria-hidden="true" />
      <h2 className="mt-4 font-serif text-3xl text-event-petrol">{copy.events.errorTitle}</h2>
      <p className="mt-2 text-event-muted">{copy.events.errorBody}</p>
      {requestId ? <p className="mt-3 font-mono text-xs text-event-muted">{organizerCopy(copy.dashboard.requestId, { id: requestId })}</p> : null}
      <button type="button" onClick={onRetry} className="premium-button mt-5 min-h-12 px-6">{copy.dashboard.retry}</button>
    </section>
  );
}

function EventsEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <section className="mt-5 rounded-3xl border border-dashed border-event-outline-subtle bg-white/70 px-6 py-16 text-center">
      <CalendarPlus className="mx-auto text-event-teal" size={42} strokeWidth={1.4} aria-hidden="true" />
      <h2 className="mt-5 font-serif text-3xl text-event-petrol">{filtered ? copy.events.emptyTitle : copy.events.firstEmptyTitle}</h2>
      <p className="mx-auto mt-2 max-w-lg text-event-muted">{filtered ? copy.events.emptyBody : copy.events.firstEmptyBody}</p>
      {filtered ? (
        <button type="button" onClick={onClear} className="mt-5 min-h-12 rounded-full bg-event-surface px-5 py-3 text-sm font-bold text-event-petrol">{copy.events.clear}</button>
      ) : (
        <Link href="/evenements/creer" className="premium-button mt-6 min-h-12 px-6">{copy.events.firstEmptyAction}</Link>
      )}
    </section>
  );
}

function accessLabel(type?: NonNullable<OrganizerEvent['accessPolicy']>['type']): string {
  if (type === 'registration_required') return copy.access.registrationAccess;
  if (type === 'access_code') return copy.access.codeAccess;
  if (type === 'email_domain') return copy.access.domainAccess;
  if (type === 'manual_approval') return copy.access.approvalAccess;
  if (type === 'guest_list') return copy.access.guestListAccess;
  if (type === 'invitation_token') return copy.access.inviteOnlyAccess;
  return copy.access.openAccess;
}

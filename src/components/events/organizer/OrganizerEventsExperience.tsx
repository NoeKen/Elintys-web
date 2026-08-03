'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, CalendarPlus, Grid2X2, List, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { DashboardEventCard } from '@/components/events/DashboardEventCard';
import { eventsService } from '@/features/events/services/events.service';
import type { Event, EventStatus } from '@/features/events/types';
import { getCompletionPercent, getNextStep } from '@/features/events/lib/event-creation';
import { organizerCopy, organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import { getOptimizedMediaUrl } from '@/shared/lib/media';
import { cn } from '@/shared/lib/utils';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | EventStatus;
type SortMode = 'newest' | 'date' | 'title';

const PAGE_SIZE = 6;
const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: copy.events.all }, { value: 'draft', label: copy.events.drafts },
  { value: 'published', label: copy.events.published }, { value: 'completed', label: copy.events.completed },
  { value: 'cancelled', label: copy.events.cancelled },
];

export function OrganizerEventsExperience() {
  const [view, setView] = useState<ViewMode>('grid');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase('fr-CA'));
  const query = useQuery({
    queryKey: ['my-events', 'catalogue'],
    queryFn: () => eventsService.getMyEvents({ page: 1, limit: 100 }),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const source = query.data?.data ?? [];
    return source
      .filter((event) => status === 'all' || event.status === status)
      .filter((event) => !deferredSearch || [event.title, event.eventType, event.location?.name, event.location?.city].filter(Boolean).some((value) => String(value).toLocaleLowerCase('fr-CA').includes(deferredSearch)))
      .toSorted((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title, 'fr-CA');
        if (sort === 'date') return new Date(a.startDate ?? '9999-12-31').getTime() - new Date(b.startDate ?? '9999-12-31').getTime();
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [deferredSearch, query.data?.data, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resetPage = () => setPage(1);

  return (
    <div className="mx-auto max-w-7xl px-1 py-5 sm:px-3 sm:py-8">
      <header className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-event-panel backdrop-blur-xl sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow mb-4">{copy.events.eyebrow}</p>
            <h1 className="font-serif text-[clamp(2.8rem,7vw,5rem)] leading-none text-event-petrol">{copy.events.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-event-muted">{copy.events.subtitle}</p>
          </div>
          <Link href="/evenements/creer" className="premium-button min-h-12 shrink-0 px-6"><CalendarPlus size={18} />{copy.dashboard.create}</Link>
        </div>
      </header>

      <section className="mt-4 rounded-3xl border border-white/60 bg-white/75 p-4 shadow-event-soft backdrop-blur-xl" aria-label={copy.events.filters}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((item) => <button key={item.value} type="button" onClick={() => { setStatus(item.value); resetPage(); }} className={cn('shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors', status === item.value ? 'bg-event-petrol text-white shadow-event-button' : 'bg-event-surface text-event-muted hover:text-event-petrol')}>{item.label}</button>)}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:min-w-64">
              <span className="sr-only">{copy.events.search}</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-event-muted" size={17} />
              <input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder={copy.events.search} className="h-11 w-full rounded-full border border-event-outline-subtle/60 bg-event-surface pl-10 pr-4 text-sm outline-none transition focus:border-event-gold focus:ring-2 focus:ring-event-gold/20" />
            </label>
            <label className="relative"><span className="sr-only">{copy.events.filters}</span><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={16} /><select value={sort} onChange={(event) => { setSort(event.target.value as SortMode); resetPage(); }} className="h-11 appearance-none rounded-full border border-event-outline-subtle/60 bg-event-surface pl-10 pr-8 text-sm font-bold text-event-petrol"><option value="newest">{copy.events.newest}</option><option value="date">{copy.events.date}</option><option value="title">{copy.events.titleSort}</option></select></label>
            <div className="flex rounded-full bg-event-surface p-1" aria-label="Mode d’affichage">
              <ViewButton active={view === 'grid'} label={copy.events.grid} onClick={() => setView('grid')} icon={<Grid2X2 size={16} />} />
              <ViewButton active={view === 'list'} label={copy.events.list} onClick={() => setView('list')} icon={<List size={16} />} />
            </div>
          </div>
        </div>
      </section>

      {query.isLoading ? <EventsLoading view={view} /> : query.isError ? <EventsError onRetry={() => void query.refetch()} /> : visible.length === 0 ? <EventsEmpty onClear={() => { setSearch(''); setStatus('all'); setSort('newest'); resetPage(); }} /> : (
        <>
          {view === 'grid' ? <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((event, index) => <DashboardEventCard key={event._id} event={event} priority={index === 0} />)}</div> : <EventList events={visible} />}
          <nav className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/75 px-5 py-4 sm:flex-row" aria-label="Pagination des événements">
            <p className="text-sm text-event-muted">{organizerCopy(copy.events.showing, { from: (safePage - 1) * PAGE_SIZE + 1, to: Math.min(safePage * PAGE_SIZE, filtered.length), total: filtered.length })}</p>
            <div className="flex items-center gap-2"><button type="button" aria-label="Page précédente" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-event-surface disabled:opacity-35"><ArrowLeft size={16} /></button><span className="min-w-20 text-center text-sm font-bold text-event-petrol">{safePage} / {totalPages}</span><button type="button" aria-label="Page suivante" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-event-petrol text-white disabled:opacity-35"><ArrowRight size={16} /></button></div>
          </nav>
        </>
      )}
    </div>
  );
}

function ViewButton({ active, label, onClick, icon }: { active: boolean; label: string; onClick: () => void; icon: React.ReactNode }) { return <button type="button" aria-pressed={active} onClick={onClick} className={cn('inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-bold', active ? 'bg-white text-event-petrol shadow-sm' : 'text-event-muted')}>{icon}{label}</button>; }

function EventList({ events }: { events: Event[] }) {
  return <div className="mt-5 overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-event-soft"><div className="hidden grid-cols-[minmax(260px,2fr)_1fr_1.2fr_1fr_0.7fr] gap-5 border-b border-event-outline-subtle/40 bg-event-surface px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-event-muted lg:grid"><span>{copy.events.title}</span><span>{copy.events.type}</span><span>{copy.events.date}</span><span>{copy.events.location}</span><span>{copy.events.progress}</span></div>{events.map((event) => <EventListRow key={event._id} event={event} />)}</div>;
}

function EventListRow({ event }: { event: Event }) {
  const cover = event.coverImage ? getOptimizedMediaUrl(event.coverImage, 'thumbnail') : undefined;
  const href = event.status === 'draft' ? `/tableau-de-bord/evenements/${event._id}/configuration?etape=${getNextStep(event)}` : `/tableau-de-bord/evenements/${event._id}`;
  return <Link href={href} className="grid gap-4 border-b border-event-outline-subtle/35 p-5 transition-colors last:border-0 hover:bg-teal-pale/25 lg:grid-cols-[minmax(260px,2fr)_1fr_1.2fr_1fr_0.7fr] lg:items-center lg:gap-5 lg:px-6">
    <span className="flex min-w-0 items-center gap-4"><span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-event-surface">{cover ? <Image src={cover} alt="" fill className="object-cover" sizes="64px" /> : <span className="flex h-full items-center justify-center font-serif text-2xl text-event-teal">E</span>}</span><span className="min-w-0"><span className="block truncate font-serif text-xl text-event-petrol">{event.title}</span><span className="mt-1 block text-xs uppercase tracking-[0.1em] text-event-muted">{event.status}</span></span></span>
    <span className="text-sm font-semibold text-event-muted">{event.eventType ?? '—'}</span>
    <span className="flex items-center gap-2 text-sm text-event-muted"><CalendarDays size={15} />{event.startDate ? new Date(event.startDate).toLocaleDateString('fr-CA') : copy.events.unknownDate}</span>
    <span className="flex items-center gap-2 text-sm text-event-muted"><MapPin size={15} />{event.location?.city ?? event.location?.name ?? copy.events.unknownLocation}</span>
    <span><span className="text-sm font-bold text-event-petrol">{getCompletionPercent(event)} %</span><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-event-surface"><span className="block h-full rounded-full bg-event-teal" style={{ width: `${getCompletionPercent(event)}%` }} /></span></span>
  </Link>;
}

function EventsLoading({ view }: { view: ViewMode }) { return <div className={cn('mt-5 grid gap-5', view === 'grid' && 'md:grid-cols-2 xl:grid-cols-3')} role="status" aria-label={copy.events.loading}>{[1,2,3,4,5,6].map((item) => <div key={item} className={cn('premium-skeleton rounded-3xl', view === 'grid' ? 'h-80' : 'h-24')} />)}</div>; }
function EventsError({ onRetry }: { onRetry: () => void }) { return <section className="mt-5 rounded-3xl border border-destructive/20 bg-white/85 p-8 text-center"><AlertCircle className="mx-auto text-destructive" size={36} /><h2 className="mt-4 font-serif text-3xl text-event-petrol">{copy.events.errorTitle}</h2><p className="mt-2 text-event-muted">{copy.events.errorBody}</p><button type="button" onClick={onRetry} className="premium-button mt-5 px-6">{copy.dashboard.retry}</button></section>; }
function EventsEmpty({ onClear }: { onClear: () => void }) { return <section className="mt-5 rounded-3xl border border-dashed border-event-outline-subtle bg-white/70 px-6 py-16 text-center"><CalendarPlus className="mx-auto text-event-teal" size={42} strokeWidth={1.4} /><h2 className="mt-5 font-serif text-3xl text-event-petrol">{copy.events.emptyTitle}</h2><p className="mt-2 text-event-muted">{copy.events.emptyBody}</p><button type="button" onClick={onClear} className="mt-5 rounded-full bg-event-surface px-5 py-3 text-sm font-bold text-event-petrol">{copy.events.clear}</button></section>; }

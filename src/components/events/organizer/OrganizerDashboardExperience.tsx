'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  Compass,
  History,
  LayoutGrid,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { DashboardEventCard } from '@/components/events/DashboardEventCard';
import {
  eventsService,
  type OrganizerActionCode,
  type OrganizerDashboardAction,
} from '@/features/events/services/events.service';
import { getNextStep } from '@/features/events/lib/event-creation';
import {
  organizerCopy,
  organizerEventCopy as copy,
} from '@/features/events/i18n/organizer-event.copy';
import { ApiClientError } from '@/shared/lib/api';
import { useAuth } from '@/shared/hooks/useAuth';

const ACTION_DESCRIPTION_KEYS: Record<OrganizerActionCode, keyof typeof copy.actions> = {
  REVIEW_ACCESS_REQUESTS: 'REVIEW_ACCESS_REQUESTS_DESCRIPTION',
  COMPLETE_INFORMATION: 'COMPLETE_INFORMATION_DESCRIPTION',
  COMPLETE_SCHEDULE: 'COMPLETE_SCHEDULE_DESCRIPTION',
  ADD_VENUE: 'ADD_VENUE_DESCRIPTION',
  ADD_COVER: 'ADD_COVER_DESCRIPTION',
  CONFIGURE_ACCESS: 'CONFIGURE_ACCESS_DESCRIPTION',
  CONFIGURE_TICKETS: 'CONFIGURE_TICKETS_DESCRIPTION',
  CONTINUE_CREATION: 'CONTINUE_CREATION_DESCRIPTION',
  PUBLISH_EVENT: 'PUBLISH_EVENT_DESCRIPTION',
};

export function OrganizerDashboardExperience() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['organizer-dashboard-summary'],
    queryFn: () => eventsService.getOrganizerSummary(),
    staleTime: 30_000,
  });

  if (query.isLoading) return <DashboardExperienceLoading />;
  if (query.isError) {
    const requestId = query.error instanceof ApiClientError ? query.error.requestId : undefined;
    return <DashboardExperienceError requestId={requestId} onRetry={() => void query.refetch()} />;
  }

  const summary = query.data;
  if (!summary) return null;
  const firstName = user?.firstName?.trim();
  const greeting = firstName
    ? organizerCopy(copy.dashboard.greeting, { name: firstName })
    : copy.dashboard.greetingNoName;

  return (
    <div className="mx-auto max-w-7xl px-1 py-5 sm:px-3 sm:py-8">
      <DashboardHeader greeting={greeting} />

      {summary.metrics.totalEvents === 0 ? (
        <NewOrganizerDashboard />
      ) : (
        <>
          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={copy.dashboard.eyebrow}>
            <MetricCard label={copy.dashboard.active} value={summary.metrics.activeEvents} icon={<Sparkles size={20} />} />
            <MetricCard label={copy.dashboard.upcoming} value={summary.metrics.upcomingEvents} icon={<CalendarDays size={20} />} warm />
            <MetricCard label={copy.dashboard.drafts} value={summary.metrics.draftEvents} icon={<ClipboardCheck size={20} />} />
            <MetricCard label={copy.dashboard.actions} value={summary.metrics.pendingActions} icon={<AlertCircle size={20} />} alert={summary.metrics.pendingActions > 0} />
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,2fr)]">
            <PriorityActions actions={summary.actions} />
            <section aria-labelledby="upcoming-events-title">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id="upcoming-events-title" className="font-serif text-3xl text-event-petrol">{copy.dashboard.nextEvents}</h2>
                <Link href="/tableau-de-bord/evenements" className="text-sm font-bold text-event-teal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-event-gold">
                  {copy.dashboard.seeAll}
                </Link>
              </div>
              {summary.upcoming.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  {summary.upcoming.slice(0, 3).map((event, index) => (
                    <DashboardEventCard key={event._id} event={event} priority={index === 0} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-52 items-center justify-center rounded-3xl border border-dashed border-event-outline-subtle bg-white/65 px-6 text-center text-sm leading-6 text-event-muted">
                  {copy.dashboard.noUpcoming}
                </div>
              )}
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <DashboardShortcuts />
            <section className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-event-soft" aria-labelledby="recent-activity-title">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-event-surface text-event-teal" aria-hidden="true"><History size={20} /></span>
                <h2 id="recent-activity-title" className="font-serif text-3xl text-event-petrol">{copy.dashboard.recentActivity}</h2>
              </div>
              <p className="mt-8 rounded-2xl bg-event-surface px-5 py-8 text-sm leading-6 text-event-muted">
                {copy.dashboard.recentActivityEmpty}
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardHeader({ greeting }: { greeting: string }) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-6 shadow-event-panel backdrop-blur-xl sm:p-9">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-pale/80 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="section-eyebrow mb-4">{copy.dashboard.eyebrow}</p>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] text-event-petrol">{greeting}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-event-muted">{copy.dashboard.introduction}</p>
        </div>
        <Link href="/evenements/creer" className="premium-button min-h-12 shrink-0 px-6">
          <CalendarPlus size={18} aria-hidden="true" />{copy.dashboard.create}
        </Link>
      </div>
    </header>
  );
}

function MetricCard({ label, value, icon, warm = false, alert = false }: { label: string; value: number; icon: React.ReactNode; warm?: boolean; alert?: boolean }) {
  return (
    <article className={`rounded-3xl border p-5 shadow-event-soft ${alert ? 'border-destructive/20 bg-terracotta-pale' : warm ? 'border-event-orange/20 bg-white/80' : 'border-white/70 bg-white/75'}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${alert ? 'bg-white text-destructive' : warm ? 'bg-terracotta-pale text-terracotta-dark' : 'bg-teal-pale text-event-teal'}`} aria-hidden="true">{icon}</div>
      <p className="mt-5 font-serif text-4xl leading-none text-event-petrol">{value.toLocaleString('fr-CA')}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-event-muted">{label}</p>
    </article>
  );
}

function PriorityActions({ actions }: { actions: OrganizerDashboardAction[] }) {
  return (
    <section className="rounded-3xl bg-event-petrol p-6 text-white shadow-event-button" aria-labelledby="priority-actions-title">
      <p id="priority-actions-title" className="text-xs font-bold uppercase tracking-[0.16em] text-event-orange">{copy.dashboard.now}</p>
      <div className="mt-6 space-y-4">
        {actions.length === 0 ? (
          <p className="text-sm leading-6 text-white/75">{copy.dashboard.noAction}</p>
        ) : actions.map((action) => {
          const description = organizerCopy(copy.actions[ACTION_DESCRIPTION_KEYS[action.code]], {
            title: action.event.title,
            count: action.requestCount ?? 0,
          });
          return (
            <Link key={`${action.event._id}-${action.code}`} href={getActionHref(action)} className="group block rounded-2xl bg-white/8 p-4 transition-colors hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-orange">
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold leading-5">{copy.actions[action.code]}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/65">{description}</span>
                </span>
                <ArrowRight size={16} className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
              <span className="mt-3 flex items-center justify-between gap-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/55">
                <span>{priorityLabel(action.priority)}</span><span>{action.progress} %</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function DashboardShortcuts() {
  const shortcuts = [
    { href: '/evenements/creer', label: copy.dashboard.create, icon: <CalendarPlus size={19} /> },
    { href: '/tableau-de-bord/evenements', label: copy.events.title, icon: <LayoutGrid size={19} /> },
    { href: '/lieux', label: copy.dashboard.findVenue, icon: <Building2 size={19} /> },
    { href: '/prestataires', label: copy.dashboard.findVendor, icon: <UsersRound size={19} /> },
  ];
  return (
    <section className="rounded-3xl bg-event-petrol p-6 text-white shadow-event-button" aria-labelledby="shortcuts-title">
      <h2 id="shortcuts-title" className="font-serif text-3xl">{copy.dashboard.shortcuts}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className="flex min-h-14 items-center gap-3 rounded-2xl bg-white/8 px-4 text-sm font-bold transition-colors hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-orange">
            <span className="text-event-orange" aria-hidden="true">{item.icon}</span>{item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function NewOrganizerDashboard() {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-white/60 bg-white/75 shadow-event-panel backdrop-blur-xl">
      <div className="grid min-h-[430px] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-7 sm:p-12">
          <p className="section-eyebrow mb-5">{copy.dashboard.emptyEyebrow}</p>
          <h2 className="max-w-2xl font-serif text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.95] text-event-petrol">{copy.dashboard.emptyTitle}</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-event-muted">{copy.dashboard.emptyBody}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/evenements/creer" className="premium-button min-h-12 px-6"><CalendarPlus size={18} aria-hidden="true" />{copy.dashboard.emptyCreate}</Link>
            <Link href="/evenements" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-event-surface px-6 text-sm font-bold text-event-petrol"><Compass size={18} aria-hidden="true" />{copy.dashboard.emptyExplore}</Link>
          </div>
        </div>
        <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-teal-pale via-white to-terracotta-pale lg:flex" aria-hidden="true">
          <div className="h-64 w-64 rounded-full border border-dashed border-event-teal/30" />
          <CalendarPlus className="absolute text-event-petrol/70" size={88} strokeWidth={1} />
        </div>
      </div>
    </section>
  );
}

function DashboardExperienceLoading() {
  return <div className="mx-auto max-w-7xl px-2 py-8" role="status" aria-label={copy.dashboard.loading}><div className="premium-skeleton h-64 rounded-3xl" /><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="premium-skeleton h-40 rounded-3xl" />)}</div></div>;
}

function DashboardExperienceError({ requestId, onRetry }: { requestId?: string; onRetry: () => void }) {
  return (
    <section className="mx-auto mt-12 max-w-3xl rounded-3xl border border-destructive/20 bg-white/85 p-8 text-center shadow-event-panel">
      <AlertCircle className="mx-auto text-destructive" size={38} aria-hidden="true" />
      <h1 className="mt-5 font-serif text-4xl text-event-petrol">{copy.dashboard.errorTitle}</h1>
      <p className="mx-auto mt-3 max-w-xl text-event-muted">{copy.dashboard.errorBody}</p>
      {requestId ? <p className="mt-3 font-mono text-xs text-event-muted">{organizerCopy(copy.dashboard.requestId, { id: requestId })}</p> : null}
      <button type="button" onClick={onRetry} className="premium-button mt-6 min-h-12 px-6">{copy.dashboard.retry}</button>
    </section>
  );
}

function getActionHref(action: OrganizerDashboardAction): string {
  const base = `/tableau-de-bord/evenements/${action.event._id}`;
  if (action.code === 'REVIEW_ACCESS_REQUESTS') return `${base}/acces-et-inscriptions`;
  if (action.code === 'CONFIGURE_TICKETS') return `${base}/billetterie`;
  if (action.code === 'PUBLISH_EVENT') return base;
  const stepByCode: Partial<Record<OrganizerActionCode, number>> = {
    COMPLETE_INFORMATION: 1,
    COMPLETE_SCHEDULE: 2,
    ADD_VENUE: 3,
    ADD_COVER: 5,
    CONFIGURE_ACCESS: 5,
  };
  const step = stepByCode[action.code] ?? getNextStep(action.event);
  return `${base}/configuration?etape=${step}`;
}

function priorityLabel(priority: OrganizerDashboardAction['priority']): string {
  if (priority === 'high') return copy.dashboard.highPriority;
  if (priority === 'low') return copy.dashboard.lowPriority;
  return copy.dashboard.mediumPriority;
}

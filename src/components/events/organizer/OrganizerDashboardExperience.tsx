'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, CalendarDays, CalendarPlus, Compass, Sparkles, UsersRound } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { eventsService } from '@/features/events/services/events.service';
import type { Event } from '@/features/events/types';
import { DashboardEventCard } from '@/components/events/DashboardEventCard';
import { getCompletionPercent, getNextStep } from '@/features/events/lib/event-creation';
import { organizerCopy, organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';

function requiredAction(event: Event): string | null {
  if (event.status !== 'draft') return null;
  const step = getNextStep(event);
  if (step === 2) return `Définir la date de « ${event.title} »`;
  if (step === 3) return `Choisir le lieu de « ${event.title} »`;
  if (step === 5) return `Composer l’identité de « ${event.title} »`;
  if (step === 6) return `Vérifier puis publier « ${event.title} »`;
  return `Continuer la configuration de « ${event.title} »`;
}

export function OrganizerDashboardExperience() {
  const { user } = useAuth();
  const [now] = useState(() => Date.now());
  const query = useQuery({
    queryKey: ['my-events', 'dashboard'],
    queryFn: () => eventsService.getMyEvents({ page: 1, limit: 100 }),
    staleTime: 30_000,
  });

  if (query.isLoading) return <DashboardExperienceLoading />;
  if (query.isError) return <DashboardExperienceError onRetry={() => void query.refetch()} />;

  const events = query.data?.data ?? [];
  if (events.length === 0) return <NewOrganizerDashboard />;

  const active = events.filter((event) => event.status === 'published').length;
  const upcoming = events.filter((event) => event.startDate && new Date(event.startDate).getTime() >= now && event.status !== 'cancelled');
  const capacity = events.reduce((sum, event) => sum + Math.max(0, event.capacity ?? 0), 0);
  const actions = events.map((event) => ({ event, label: requiredAction(event) })).filter((item): item is { event: Event; label: string } => Boolean(item.label));
  const nextEvents = [...upcoming].sort((a, b) => new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime()).slice(0, 3);
  const firstName = user?.firstName || 'organisateur';

  return (
    <div className="mx-auto max-w-7xl px-1 py-5 sm:px-3 sm:py-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-6 shadow-event-panel backdrop-blur-xl sm:p-9">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-pale/80 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow mb-4">{copy.dashboard.eyebrow}</p>
            <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] text-event-petrol">
              {organizerCopy(copy.dashboard.greeting, { name: firstName })}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-event-muted">{copy.dashboard.introduction}</p>
          </div>
          <Link href="/evenements/creer" className="premium-button min-h-12 shrink-0 px-6">
            <CalendarPlus size={18} aria-hidden="true" />{copy.dashboard.create}
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={copy.dashboard.eyebrow}>
        <MetricCard label={copy.dashboard.active} value={active} icon={<Sparkles size={20} />} />
        <MetricCard label={copy.dashboard.upcoming} value={upcoming.length} icon={<CalendarDays size={20} />} warm />
        <MetricCard label={copy.dashboard.capacity} value={capacity.toLocaleString('fr-CA')} icon={<UsersRound size={20} />} />
        <MetricCard label={copy.dashboard.actions} value={actions.length} icon={<AlertCircle size={20} />} alert={actions.length > 0} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,2fr)]">
        <section className="rounded-3xl bg-event-petrol p-6 text-white shadow-event-button">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-event-orange">{copy.dashboard.now}</p>
          <div className="mt-6 space-y-4">
            {actions.length === 0 ? <p className="text-sm leading-6 text-white/75">{copy.dashboard.noAction}</p> : actions.slice(0, 4).map(({ event, label }) => (
              <Link key={event._id} href={`/tableau-de-bord/evenements/${event._id}/configuration?etape=${getNextStep(event)}`} className="group flex items-start justify-between gap-3 rounded-2xl bg-white/8 p-4 transition-colors hover:bg-white/14">
                <span>
                  <span className="block text-sm font-semibold leading-5">{label}</span>
                  <span className="mt-1 block text-xs text-white/60">{getCompletionPercent(event)} % complété</span>
                </span>
                <ArrowRight size={16} className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-serif text-3xl text-event-petrol">{copy.dashboard.nextEvents}</h2>
            <Link href="/tableau-de-bord/evenements" className="text-sm font-bold text-event-teal hover:underline">{copy.dashboard.seeAll}</Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(nextEvents.length > 0 ? nextEvents : events.slice(0, 3)).map((event, index) => <DashboardEventCard key={event._id} event={event} priority={index === 0} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, warm = false, alert = false }: { label: string; value: string | number; icon: React.ReactNode; warm?: boolean; alert?: boolean }) {
  return (
    <article className={`rounded-3xl border p-5 shadow-event-soft ${alert ? 'border-destructive/20 bg-terracotta-pale' : warm ? 'border-event-orange/20 bg-white/80' : 'border-white/70 bg-white/75'}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${alert ? 'bg-white text-destructive' : warm ? 'bg-terracotta-pale text-terracotta-dark' : 'bg-teal-pale text-event-teal'}`} aria-hidden="true">{icon}</div>
      <p className="mt-5 font-serif text-4xl leading-none text-event-petrol">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-event-muted">{label}</p>
    </article>
  );
}

function NewOrganizerDashboard() {
  return (
    <section className="mx-auto mt-6 max-w-6xl overflow-hidden rounded-3xl border border-white/60 bg-white/75 shadow-event-panel backdrop-blur-xl">
      <div className="grid min-h-[520px] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-7 sm:p-12">
          <p className="section-eyebrow mb-5">{copy.dashboard.emptyEyebrow}</p>
          <h1 className="max-w-2xl font-serif text-[clamp(2.8rem,7vw,5rem)] leading-[0.95] text-event-petrol">{copy.dashboard.emptyTitle}</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-event-muted">{copy.dashboard.emptyBody}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/evenements/creer" className="premium-button min-h-12 px-6"><CalendarPlus size={18} />{copy.dashboard.emptyCreate}</Link>
            <Link href="/evenements" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-event-surface px-6 text-sm font-bold text-event-petrol"><Compass size={18} />{copy.dashboard.emptyExplore}</Link>
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
  return <div className="mx-auto max-w-7xl px-2 py-8" role="status" aria-label={copy.dashboard.loading}><div className="premium-skeleton h-64 rounded-3xl" /><div className="mt-4 grid gap-3 sm:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="premium-skeleton h-40 rounded-3xl" />)}</div></div>;
}

function DashboardExperienceError({ onRetry }: { onRetry: () => void }) {
  return <section className="mx-auto mt-12 max-w-3xl rounded-3xl border border-destructive/20 bg-white/85 p-8 text-center shadow-event-panel"><AlertCircle className="mx-auto text-destructive" size={38} /><h1 className="mt-5 font-serif text-4xl text-event-petrol">{copy.dashboard.errorTitle}</h1><p className="mx-auto mt-3 max-w-xl text-event-muted">{copy.dashboard.errorBody}</p><button type="button" onClick={onRetry} className="premium-button mt-6 px-6">{copy.dashboard.retry}</button></section>;
}

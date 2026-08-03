'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Eye, Image as ImageIcon, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import { getCompletionPercent, getNextStep } from '@/features/events/lib/event-creation';
import { organizerCopy, organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';

export default function EventDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['event', id], queryFn: () => eventsService.get(id), staleTime: 30_000 });
  const readiness = useQuery({ queryKey: ['event-publish-readiness', id], queryFn: () => eventsService.getPublishReadiness(id), enabled: Boolean(query.data), staleTime: 15_000 });
  const publish = useMutation({ mutationFn: () => eventsService.publish(id), onSuccess: (event) => { queryClient.setQueryData(['event', id], event); void queryClient.invalidateQueries({ queryKey: ['my-events'] }); } });

  if (query.isLoading) return <div className="p-6"><div className="premium-skeleton h-72 rounded-3xl" /></div>;
  if (query.isError || !query.data) return <section className="m-6 rounded-3xl border border-destructive/20 bg-white p-7 text-center"><AlertCircle className="mx-auto text-destructive" /><h1 className="mt-4 font-serif text-3xl text-event-petrol">Événement introuvable</h1><button type="button" onClick={() => void query.refetch()} className="premium-button mt-5 px-6">Réessayer</button></section>;

  const event = query.data;
  const progress = getCompletionPercent(event);
  const base = `/tableau-de-bord/evenements/${id}`;
  const checklist = [
    { label: 'Définir le titre et la description', done: Boolean(event.title && event.shortDescription) },
    { label: 'Ajouter une bannière visuelle', done: Boolean(event.coverImage) },
    { label: 'Définir la date ou la marquer provisoire', done: Boolean(event.startDate || event.dateIsTentative) },
    { label: 'Configurer l’accès et l’admission', done: Boolean(event.accessPolicy && event.admissionModes?.length) },
  ];
  const actions = checklist.filter((item) => !item.done);

  return <div className="p-4 sm:p-6 lg:p-8">
    <section className="rounded-3xl bg-white p-6 shadow-event-soft sm:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-terracotta-pale px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-terracotta-dark">{event.status}</span><span className="rounded-full bg-event-surface px-3 py-1 text-xs font-bold text-event-muted">{event.discoverability ?? 'public'}</span></div><h1 className="mt-5 font-serif text-[clamp(2.6rem,6vw,4.8rem)] leading-none text-event-petrol">{copy.workspace.finalize}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-event-muted">{organizerCopy(copy.workspace.completion, { percent: progress })}</p></div>
        <div className="flex gap-2"><Link href={`${base}/configuration?etape=${getNextStep(event)}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-event-surface px-5 text-sm font-bold text-event-petrol">{copy.workspace.configure}</Link><button type="button" onClick={() => publish.mutate()} disabled={!readiness.data?.publishable || publish.isPending || event.status === 'published'} className="premium-button min-h-12 px-6 disabled:cursor-not-allowed disabled:opacity-45">{event.status === 'published' ? 'Événement publié' : copy.workspace.publish}</button></div>
      </div>
      <div className="mt-8 h-2 overflow-hidden rounded-full bg-event-surface" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span className="block h-full rounded-full bg-event-teal transition-[width]" style={{ width: `${progress}%` }} /></div>
      {publish.isError ? <FormErrorAlert className="mt-5" error={getUserFacingError(publish.error, { fallback: 'L’événement ne peut pas encore être publié. Vérifiez les éléments requis.' })} /> : null}
    </section>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
      <div className="space-y-6">
        <section><h2 className="font-serif text-3xl text-event-petrol">{copy.workspace.now}</h2><div className="mt-4 space-y-3">{actions.length === 0 ? <div className="rounded-3xl bg-sage-pale p-5 text-sm font-semibold text-sage-dark">Votre configuration contient tous les éléments essentiels.</div> : actions.map((item) => <Link key={item.label} href={`${base}/configuration?etape=${getNextStep(event)}`} className="flex items-center justify-between rounded-3xl border border-event-outline-subtle/40 bg-white p-5 shadow-event-soft"><span className="flex items-center gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta-pale text-terracotta-dark"><AlertCircle size={19} /></span><span className="font-bold text-event-petrol">{item.label}</span></span><span className="text-sm font-bold text-event-teal">{copy.workspace.configure}</span></Link>)}</div></section>
        <section className="rounded-3xl bg-white p-6 shadow-event-soft"><h2 className="font-serif text-3xl text-event-petrol">{copy.workspace.checklist}</h2><ul className="mt-5 space-y-4">{checklist.map((item) => <li key={item.label} className="flex items-center gap-3 text-event-muted"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${item.done ? 'bg-event-petrol text-white' : 'border-2 border-event-outline-subtle'}`}>{item.done ? <Check size={15} /> : null}</span>{item.label}</li>)}</ul></section>
      </div>
      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><MiniMetric label="Capacité" value={event.capacity ?? 0} icon={<UsersRound size={18} />} /><MiniMetric label="Médias" value={(event.gallery?.length ?? 0) + (event.coverImage ? 1 : 0)} icon={<ImageIcon size={18} />} /></div>
        {event.slug && event.status === 'published' ? <Link href={`/evenements/${event.slug}`} className="flex min-h-36 flex-col justify-end rounded-3xl bg-event-petrol p-6 text-white shadow-event-button"><Eye size={24} /><span className="mt-6 font-serif text-2xl">Aperçu public</span><span className="mt-1 text-sm text-white/65">Voir la page publiée</span></Link> : null}
        <section className="rounded-3xl border border-event-outline-subtle/50 bg-white p-6"><h2 className="font-serif text-2xl text-event-petrol">{copy.workspace.currentConfiguration}</h2><dl className="mt-5 space-y-4 text-sm"><ConfigurationRow icon={<Eye size={17} />} label="Visibilité" value={event.discoverability ?? 'public'} /><ConfigurationRow icon={<ShieldCheck size={17} />} label="Accès" value={event.accessPolicy?.type ?? 'open'} /><ConfigurationRow icon={<MapPin size={17} />} label="Lieu" value={event.location?.city ?? event.location?.name ?? 'À définir'} /></dl></section>
      </aside>
    </div>
  </div>;
}

function MiniMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) { return <article className="rounded-3xl bg-white p-5 shadow-event-soft"><span className="text-event-teal" aria-hidden="true">{icon}</span><p className="mt-5 font-serif text-4xl text-event-petrol">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-event-muted">{label}</p></article>; }
function ConfigurationRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-start gap-3"><span className="mt-0.5 text-event-teal" aria-hidden="true">{icon}</span><div><dt className="font-bold text-event-petrol">{label}</dt><dd className="mt-0.5 text-event-muted">{value}</dd></div></div>; }

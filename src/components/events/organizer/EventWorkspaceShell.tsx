'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Image as ImageIcon, Info, LayoutGrid, MapPin, Settings, ShieldCheck, Ticket, Users, UsersRound } from 'lucide-react';
import type { ComponentType } from 'react';
import { eventsService } from '@/features/events/services/events.service';
import { organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import { cn } from '@/shared/lib/utils';

interface WorkspaceShellProps { children: React.ReactNode; }

const ITEMS: Array<{ label: string; suffix: string; icon: ComponentType<{ size?: number; className?: string }> }> = [
  { label: copy.workspace.overview, suffix: '', icon: LayoutGrid },
  { label: copy.workspace.information, suffix: 'configuration?etape=1', icon: Info },
  { label: copy.workspace.venue, suffix: 'lieux', icon: MapPin },
  { label: copy.workspace.providers, suffix: 'prestataires', icon: UsersRound },
  { label: copy.workspace.access, suffix: 'acces-et-inscriptions', icon: ShieldCheck },
  { label: copy.workspace.ticketing, suffix: 'billetterie', icon: Ticket },
  { label: copy.workspace.guests, suffix: 'invites', icon: Users },
  { label: copy.workspace.media, suffix: 'configuration?etape=5', icon: ImageIcon },
  { label: copy.workspace.settings, suffix: 'configuration?etape=6', icon: Settings },
];

const STATUS_LABELS: Record<string, string> = {
  draft: copy.workspace.statusDraft,
  published: copy.workspace.statusPublished,
  completed: copy.workspace.statusCompleted,
  cancelled: copy.workspace.statusCancelled,
  ongoing: copy.workspace.statusOngoing,
};

export function EventWorkspaceShell({ children }: WorkspaceShellProps) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const query = useQuery({ queryKey: ['event', id], queryFn: () => eventsService.get(id), staleTime: 30_000 });
  const base = `/tableau-de-bord/evenements/${id}`;
  const event = query.data;

  return (
    <div className="mx-auto max-w-[1500px] overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-event-panel backdrop-blur-xl">
      <header className="flex flex-col gap-4 border-b border-event-outline-subtle/45 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/tableau-de-bord/evenements" aria-label={copy.workspace.back} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-event-surface text-event-petrol"><ArrowLeft size={18} /></Link>
          <div className="min-w-0"><p className="truncate font-serif text-xl text-event-petrol">{event?.title ?? copy.workspace.eventFallback}</p><p className="mt-0.5 text-xs font-bold uppercase tracking-[0.12em] text-terracotta-dark">{event ? (STATUS_LABELS[event.status] ?? event.status) : copy.workspace.loadingStatus}</p></div>
        </div>
        <div className="flex gap-2">
          {event?.slug && event.status === 'published' ? <Link href={`/evenements/${event.slug}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-event-surface px-4 text-sm font-bold text-event-petrol"><Eye size={16} />{copy.workspace.preview}</Link> : null}
          <Link href={`${base}/configuration?etape=6`} className="premium-button min-h-10 px-5">{copy.workspace.publish}</Link>
        </div>
      </header>
      <div className="grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-event-outline-subtle/45 p-3 lg:border-b-0 lg:border-r lg:p-4">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label={copy.workspace.navigationLabel}>
            {ITEMS.map((item) => {
              const href = item.suffix ? `${base}/${item.suffix}` : base;
              const active = item.suffix === '' ? pathname === base : pathname.startsWith(`${base}/${item.suffix.split('?')[0]}`);
              const Icon = item.icon;
              return <Link key={item.label} href={href} className={cn('flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors lg:w-full', active ? 'bg-event-petrol text-white shadow-event-button' : 'text-event-muted hover:bg-event-surface hover:text-event-petrol')}><Icon size={17} aria-hidden="true" />{item.label}</Link>;
            })}
          </nav>
        </aside>
        <div className="min-w-0 bg-event-background/70">{children}</div>
      </div>
    </div>
  );
}

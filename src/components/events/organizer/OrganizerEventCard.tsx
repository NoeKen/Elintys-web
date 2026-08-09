'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import {
  Archive,
  CalendarDays,
  Eye,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import type { OrganizerEvent } from '@/features/events/services/events.service';
import { getCompletionPercent, getNextStep } from '@/features/events/lib/event-creation';
import {
  organizerCopy,
  organizerEventCopy as copy,
} from '@/features/events/i18n/organizer-event.copy';
import { getOptimizedMediaUrl } from '@/shared/lib/media';
import { cn } from '@/shared/lib/utils';

interface OrganizerEventActionsProps {
  event: OrganizerEvent;
  busy?: boolean;
  onPublish: (event: OrganizerEvent) => void;
  onArchive: (event: OrganizerEvent) => void;
  onRestore: (event: OrganizerEvent) => void;
  onDelete: (event: OrganizerEvent) => void;
  compact?: boolean;
}

interface OrganizerEventCardProps extends Omit<OrganizerEventActionsProps, 'compact'> {
  priority?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  draft: copy.workspace.statusDraft,
  published: copy.workspace.statusPublished,
  ongoing: copy.workspace.statusOngoing,
  completed: copy.workspace.statusCompleted,
  cancelled: copy.workspace.statusCancelled,
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gold-pale text-gold-dark',
  published: 'bg-teal-pale text-teal-dark',
  ongoing: 'bg-teal-pale text-teal-dark',
  completed: 'bg-sage-pale text-sage-dark',
  cancelled: 'bg-terracotta-pale text-terracotta-dark',
};

const DISCOVERABILITY_LABELS = {
  public: copy.access.publicVisibility,
  unlisted: copy.access.unlistedVisibility,
  private: copy.access.privateVisibility,
} as const;

const ACCESS_LABELS = {
  open: copy.access.openAccess,
  registration_required: copy.access.registrationAccess,
  access_code: copy.access.codeAccess,
  email_domain: copy.access.domainAccess,
  manual_approval: copy.access.approvalAccess,
  guest_list: copy.access.guestListAccess,
  invitation_token: copy.access.inviteOnlyAccess,
} as const;

const ADMISSION_LABELS = {
  free: copy.access.freeAdmission,
  registration_only: copy.access.registrationAdmission,
  free_ticket: copy.access.freeTicketAdmission,
  paid_ticket: copy.access.paidTicketAdmission,
  invitation: copy.access.invitationAdmission,
} as const;

export function OrganizerEventCard({
  event,
  priority = false,
  busy = false,
  onPublish,
  onArchive,
  onRestore,
  onDelete,
}: OrganizerEventCardProps) {
  const cover = event.coverImage ? getOptimizedMediaUrl(event.coverImage, 'card') : undefined;
  const manageHref = getManageHref(event);
  const progress = getCompletionPercent(event);
  const typeLabel = event.eventType ? copy.types[event.eventType] : copy.types.other;

  return (
    <article className="premium-card flex h-full flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium">
      <Link href={manageHref} className="group relative block aspect-[16/9] overflow-hidden bg-event-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold">
        {cover ? (
          <Image src={cover} alt="" fill priority={priority} className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" />
        ) : (
          <span className="flex h-full items-center justify-center font-serif text-6xl text-event-teal/35" aria-hidden="true">E</span>
        )}
        <span className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
          <StatusBadge status={event.status} archived={Boolean(event.archivedAt)} />
          <span className="rounded-full bg-white/92 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-event-petrol shadow-sm backdrop-blur">
            {DISCOVERABILITY_LABELS[event.discoverability ?? 'public']}
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-event-orange">{typeLabel}</p>
        <Link href={manageHref} className="mt-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-event-gold">
          <h2 className="line-clamp-2 font-serif text-2xl leading-tight text-event-petrol">{event.title}</h2>
        </Link>

        <div className="mt-4 grid gap-2 text-sm text-event-muted sm:grid-cols-2">
          <p className="flex items-center gap-2"><CalendarDays size={15} className="shrink-0 text-event-teal" aria-hidden="true" />{formatDate(event.startDate)}</p>
          <p className="flex items-center gap-2"><MapPin size={15} className="shrink-0 text-event-orange" aria-hidden="true" />{formatLocation(event)}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem] font-bold uppercase tracking-[0.07em]">
          <span className="rounded-full bg-event-surface px-3 py-1.5 text-event-petrol">{ACCESS_LABELS[event.accessPolicy?.type ?? 'open']}</span>
          {(event.admissionModes ?? []).slice(0, 2).map((mode) => (
            <span key={mode} className="rounded-full bg-teal-pale px-3 py-1.5 text-teal-dark">{ADMISSION_LABELS[mode]}</span>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-event-surface p-4">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-event-petrol">{copy.events.progress}</span>
            <span className="font-bold text-event-teal">{progress} %</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-event-outline-subtle/40" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${copy.events.progress} ${progress} %`}>
            <span className="block h-full rounded-full bg-event-teal" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-xs leading-5 text-event-muted">
            {event.status === 'draft'
              ? `${copy.events.continue} · ${getNextStep(event)} / 6`
              : `${copy.events.modified} · ${formatDate(event.updatedAt)}`}
          </p>
        </div>

        <div className="mt-auto pt-5">
          <OrganizerEventActions event={event} busy={busy} onPublish={onPublish} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />
        </div>
      </div>
    </article>
  );
}

export function OrganizerEventActions({
  event,
  busy = false,
  onPublish,
  onArchive,
  onRestore,
  onDelete,
  compact = false,
}: OrganizerEventActionsProps) {
  const archived = Boolean(event.archivedAt);
  const manageHref = getManageHref(event);
  const canPreview = event.status === 'published' && event.discoverability !== 'private' && Boolean(event.slug);
  const canPublish = event.status === 'draft' && event.readiness.publishable && !archived;

  return (
    <div className={cn('flex items-center gap-2', compact ? 'justify-end' : 'justify-between')}>
      {!compact && (archived ? (
        <button type="button" disabled={busy} onClick={() => onRestore(event)} className="premium-button min-h-11 flex-1 px-4 disabled:cursor-wait disabled:opacity-55">
          <RotateCcw size={16} aria-hidden="true" />{copy.events.restore}
        </button>
      ) : event.status === 'draft' ? (
        <Link href={manageHref} className="premium-button min-h-11 flex-1 px-4">{copy.events.continue}</Link>
      ) : (
        <Link href={manageHref} className="premium-button min-h-11 flex-1 px-4">{copy.events.manage}</Link>
      ))}

      {event.status === 'draft' && !archived ? (
        <button type="button" disabled={!canPublish || busy} title={!canPublish ? copy.events.publishUnavailable : undefined} onClick={() => onPublish(event)} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-colors', canPublish ? 'bg-event-orange text-event-petrol hover:bg-event-gold' : 'cursor-not-allowed bg-event-surface text-event-muted opacity-65')}>
          <Send size={16} aria-hidden="true" />{compact ? <span className="sr-only">{copy.events.publish}</span> : copy.events.publish}
        </button>
      ) : null}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" disabled={busy} aria-label={organizerCopy(copy.events.more, { title: event.title })} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-event-outline-subtle/70 bg-white text-event-petrol transition-colors hover:bg-event-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-gold disabled:opacity-50">
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-52 rounded-2xl border border-event-outline-subtle/70 bg-white p-2 text-sm shadow-event-panel" collisionPadding={12}>
            <DropdownMenu.Item asChild>
              <Link href={manageHref} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 font-semibold text-event-petrol outline-none focus:bg-event-surface">{copy.events.manage}</Link>
            </DropdownMenu.Item>
            {canPreview ? (
              <DropdownMenu.Item asChild>
                <Link href={`/evenements/${event.slug}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 font-semibold text-event-petrol outline-none focus:bg-event-surface"><Eye size={16} aria-hidden="true" />{copy.events.preview}</Link>
              </DropdownMenu.Item>
            ) : null}
            {archived ? (
              <DropdownMenu.Item onSelect={() => onRestore(event)} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 font-semibold text-event-petrol outline-none focus:bg-event-surface"><RotateCcw size={16} aria-hidden="true" />{copy.events.restore}</DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item onSelect={() => onArchive(event)} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 font-semibold text-event-petrol outline-none focus:bg-event-surface"><Archive size={16} aria-hidden="true" />{copy.events.archive}</DropdownMenu.Item>
            )}
            <DropdownMenu.Separator className="my-1 h-px bg-event-outline-subtle/60" />
            <DropdownMenu.Item onSelect={() => onDelete(event)} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 font-semibold text-destructive outline-none focus:bg-terracotta-pale"><Trash2 size={16} aria-hidden="true" />{copy.events.delete}</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

export function StatusBadge({ status, archived = false }: { status: string; archived?: boolean }) {
  return (
    <span className={cn('rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] shadow-sm', archived ? 'bg-event-petrol text-white' : STATUS_STYLES[status] ?? 'bg-event-surface text-event-petrol')}>
      {archived ? copy.events.archived : STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function getManageHref(event: OrganizerEvent): string {
  return event.status === 'draft'
    ? `/tableau-de-bord/evenements/${event._id}/configuration?etape=${getNextStep(event)}`
    : `/tableau-de-bord/evenements/${event._id}`;
}

export function formatDate(value?: string): string {
  if (!value) return copy.events.unknownDate;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return copy.events.unknownDate;
  return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLocation(event: OrganizerEvent): string {
  if (event.location?.type === 'online') return copy.events.online;
  return event.location?.name ?? event.location?.city ?? copy.events.unknownLocation;
}

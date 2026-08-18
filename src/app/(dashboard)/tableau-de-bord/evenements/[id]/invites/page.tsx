'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck } from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import {
  invitationsService,
  type OrganizerInvitation,
} from '@/features/invitations/services/invitations.service';
import { organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import { cn } from '@/shared/lib/utils';

// ─── Form schema ─────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  name: z.string().min(1, 'Requis').max(100, 'Nom trop long (100 caractères max)'),
  email: z.string().email('Courriel invalide'),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// ─── Status badge helpers ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrganizerInvitation['status'], string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  expired: 'Expirée',
};

function statusBadgeClass(status: OrganizerInvitation['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-terracotta-pale text-terracotta-dark';
    case 'accepted':
      return 'bg-sage-pale text-sage-dark';
    case 'expired':
      return 'bg-surface text-muted border border-border';
    default:
      return 'bg-surface text-muted border border-border';
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface InvitationCardProps {
  invitation: OrganizerInvitation;
}

function InvitationCard({ invitation }: InvitationCardProps) {
  return (
    <li className="rounded-3xl bg-white p-5 shadow-event-soft flex flex-col gap-3 sm:flex-row sm:items-start">
      {/* Avatar initials */}
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-pale font-bold text-event-teal text-sm"
        aria-hidden="true"
      >
        {invitation.name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-event-petrol truncate">{invitation.name}</p>
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-0.5 text-xs font-bold',
              statusBadgeClass(invitation.status),
            )}
          >
            {STATUS_LABELS[invitation.status]}
          </span>
        </div>

        <p className="mt-0.5 text-sm text-event-muted truncate">{invitation.email}</p>

        <div className="mt-2 flex flex-wrap gap-4 text-xs text-event-muted">
          <span>Type&nbsp;: Participant</span>
          <span>
            Utilisations&nbsp;: {invitation.useCount}&nbsp;/&nbsp;{invitation.maxUses}
          </span>
          <span>Expire le&nbsp;: {formatDate(invitation.expiresAt)}</span>
        </div>

      </div>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventInvitationsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Load event for the title
  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    staleTime: 30_000,
  });

  // Load invitation list
  const listQuery = useQuery({
    queryKey: ['event-invitations', id, page],
    queryFn: () => invitationsService.listByEvent(id, page, pageSize),
    staleTime: 30_000,
  });

  // Create invitation mutation
  const createMutation = useMutation({
    mutationFn: ({ name, email }: InviteFormValues) =>
      invitationsService.create({
        name,
        email,
        type: 'participant',
        eventId: id,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['event-invitations', id] });
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = (values: InviteFormValues) => {
    createMutation.mutate(values);
  };

  // ── Loading / error states ──────────────────────────────────────────────────

  if (eventQuery.isLoading || listQuery.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="premium-skeleton h-20 rounded-3xl" />
        <div className="premium-skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  if (eventQuery.isError || listQuery.isError || !eventQuery.data) {
    return (
      <section className="m-6 rounded-3xl border border-destructive/20 bg-white p-7 text-center">
        <ShieldCheck className="mx-auto text-destructive" size={32} />
        <h1 className="mt-4 font-serif text-3xl text-event-petrol">
          Impossible de charger les invitations
        </h1>
        <button
          type="button"
          onClick={() => {
            void eventQuery.refetch();
            void listQuery.refetch();
          }}
          className="premium-button mt-5 px-6"
        >
          Réessayer
        </button>
      </section>
    );
  }

  const event = eventQuery.data;
  const invitations = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-white p-6 shadow-event-soft sm:p-8">
        <p className="section-eyebrow mb-4">{event.title}</p>
        <h1 className="font-serif text-[clamp(2.2rem,5vw,3.6rem)] leading-none text-event-petrol">
          {copy.workspace.invitations}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-event-muted">
          Envoyez des invitations sécurisées aux participants. Chaque invitation génère un jeton
          unique qui n&apos;est jamais affiché dans cet espace de gestion.
        </p>
      </section>

      {/* ── Send invitation form ────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-white p-6 shadow-event-soft">
        <h2 className="font-serif text-2xl text-event-petrol mb-5">Envoyer une invitation</h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label htmlFor="inv-name" className="block text-sm font-medium text-event-petrol mb-1">
                Nom <span className="text-terracotta-dark" aria-hidden="true">*</span>
              </label>
              <input
                id="inv-name"
                type="text"
                autoComplete="name"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : undefined}
                aria-describedby={errors.name ? 'inv-name-error' : undefined}
                className={cn(
                  'w-full min-h-[44px] rounded-2xl border px-4 py-2.5 text-sm text-event-petrol placeholder:text-event-muted focus:outline-none focus:ring-2 focus:ring-teal',
                  errors.name ? 'border-destructive' : 'border-border',
                )}
                placeholder="Prénom Nom"
              />
              {errors.name && (
                <p id="inv-name-error" role="alert" className="mt-1 text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="inv-email" className="block text-sm font-medium text-event-petrol mb-1">
                Courriel <span className="text-terracotta-dark" aria-hidden="true">*</span>
              </label>
              <input
                id="inv-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'inv-email-error' : undefined}
                className={cn(
                  'w-full min-h-[44px] rounded-2xl border px-4 py-2.5 text-sm text-event-petrol placeholder:text-event-muted focus:outline-none focus:ring-2 focus:ring-teal',
                  errors.email ? 'border-destructive' : 'border-border',
                )}
                placeholder="exemple@courriel.com"
              />
              {errors.email && (
                <p id="inv-email-error" role="alert" className="mt-1 text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="premium-button min-h-[44px] px-7 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Envoi…' : "Envoyer l’invitation"}
            </button>

            {createMutation.isSuccess && (
              <p role="status" aria-live="polite" className="text-sm font-medium text-sage-dark">
                Invitation envoyée.
              </p>
            )}
          </div>

          {createMutation.isError && (
            <FormErrorAlert
              error={getUserFacingError(createMutation.error, {
                fallback: "Impossible d'envoyer l'invitation. Vérifiez les informations saisies.",
              })}
            />
          )}
        </form>
      </section>

      {/* ── Sent invitations list ───────────────────────────────────────────── */}
      <section className="rounded-3xl bg-white p-6 shadow-event-soft">
        <h2 className="font-serif text-2xl text-event-petrol mb-5">
          Invitations envoyées
          {total > 0 && (
            <span className="ml-3 text-base font-normal text-event-muted">
              ({total})
            </span>
          )}
        </h2>

        {invitations.length === 0 ? (
          <p className="text-center text-event-muted text-sm py-10">
            Aucune invitation envoyée pour cet événement.
          </p>
        ) : (
          <ul className="space-y-3" aria-label="Invitations envoyées">
            {invitations.map((invitation) => (
              <InvitationCard key={invitation._id} invitation={invitation} />
            ))}
          </ul>
        )}
        {totalPages > 1 ? (
          <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Pagination des invitations">
            <button
              type="button"
              className="premium-button-ghost min-h-[44px] rounded-full px-5 disabled:opacity-40"
              disabled={page === 1 || listQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Précédent
            </button>
            <span className="text-sm text-event-muted">Page {page} sur {totalPages}</span>
            <button
              type="button"
              className="premium-button-ghost min-h-[44px] rounded-full px-5 disabled:opacity-40"
              disabled={page >= totalPages || listQuery.isFetching}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Suivant
            </button>
          </nav>
        ) : null}
      </section>
    </div>
  );
}

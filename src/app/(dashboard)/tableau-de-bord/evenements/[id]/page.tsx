'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Eye, MapPin, ShieldCheck, Users, UsersRound } from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import { guestsService } from '@/features/guests/services/guests.service';
import { vendorRequestsService } from '@/features/vendors/services/vendor-requests.service';
import { organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import { guestKeys } from '@/features/guests/query-keys';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import api from '@/shared/lib/api';
import type { EventPublishReadinessError } from '@/features/events/services/events.service';
import type { PaginatedOrganizerInvitations } from '@/features/invitations/services/invitations.service';

const ERROR_TO_SECTION: Record<string, string> = {
  TITLE_REQUIRED: 'informations',
  EVENT_TYPE_REQUIRED: 'informations',
  START_DATE_REQUIRED: 'informations',
  END_BEFORE_START: 'informations',
  PHYSICAL_LOCATION_REQUIRED: 'lieux',
  ONLINE_URL_MISSING: 'lieux',
  FREE_TICKET_TYPE_REQUIRED: 'billetterie',
  PAID_TICKET_TYPE_REQUIRED: 'billetterie',
  LEGACY_ACCESS_CODE_REQUIRES_MIGRATION: 'acces-et-inscriptions',
};

const FIELD_TO_SECTION: Record<string, string> = {
  title: 'informations',
  eventType: 'informations',
  startDate: 'informations',
  endDate: 'informations',
  location: 'lieux',
  ticketTypes: 'billetterie',
  accessPolicy: 'acces-et-inscriptions',
  admissionModes: 'acces-et-inscriptions',
  discoverability: 'acces-et-inscriptions',
};

const READINESS_LABELS: Record<string, string> = {
  TITLE_REQUIRED: 'Ajouter un titre',
  EVENT_TYPE_REQUIRED: "Choisir un type d'événement",
  START_DATE_REQUIRED: 'Ajouter une date de début',
  END_BEFORE_START: 'Corriger les dates',
  PHYSICAL_LOCATION_REQUIRED: 'Compléter le lieu',
  ONLINE_URL_MISSING: 'Ajouter le lien en ligne',
  FREE_TICKET_TYPE_REQUIRED: 'Créer un billet gratuit',
  PAID_TICKET_TYPE_REQUIRED: 'Créer un billet payant',
  LEGACY_ACCESS_CODE_REQUIRES_MIGRATION: "Mettre à jour la configuration d'accès",
};

const STATUS_MESSAGES: Record<string, string> = {
  draft: 'Votre événement est en cours de création.',
  published: 'Votre événement est publié et visible.',
  completed: 'Cet événement est terminé.',
  cancelled: 'Cet événement a été annulé.',
  ongoing: 'Votre événement est en cours.',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  completed: 'Terminé',
  cancelled: 'Annulé',
  ongoing: 'En cours',
};

const DISCOVERABILITY_LABELS: Record<string, string> = {
  public: 'Public',
  unlisted: 'Non répertorié',
  private: 'Privé',
};

const ACCESS_POLICY_LABELS: Record<string, string> = {
  open: 'Accès libre',
  registration_required: 'Inscription requise',
  access_code: "Code d’accès",
  email_domain: 'Domaine autorisé',
  manual_approval: 'Approbation manuelle',
  guest_list: 'Liste d’invités',
  invitation_token: 'Invitation uniquement',
};

function formatEventDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function KpiSkeleton() {
  return <div className="premium-skeleton h-24 w-full rounded-3xl" />;
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-event-soft">
      <span className="text-event-teal" aria-hidden="true">{icon}</span>
      <p className="mt-4 font-serif text-3xl text-event-petrol">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-event-muted">{label}</p>
    </article>
  );
}

function ConfigurationRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-x-3">
      <span className="row-span-2 mt-0.5 text-event-teal" aria-hidden="true">{icon}</span>
      <dt className="font-bold text-event-petrol">{label}</dt>
      <dd className="mt-0.5 text-event-muted">{value}</dd>
    </div>
  );
}

function ReadinessActionCard({
  error,
  base,
  isWarning,
}: {
  error: EventPublishReadinessError | string;
  base: string;
  isWarning?: boolean;
}) {
  const code = typeof error === 'string' ? error : error.code;
  const field = typeof error === 'string' ? undefined : error.field;
  const section = ERROR_TO_SECTION[code] ?? (field ? FIELD_TO_SECTION[field] : undefined);
  const href = section ? `${base}/${section}` : base;

  const label = READINESS_LABELS[code] ?? 'Compléter la configuration requise';

  return (
    <Link
      href={href}
      className={`flex min-h-[44px] items-center justify-between rounded-3xl border p-5 shadow-event-soft ${
        isWarning
          ? 'border-amber-200/60 bg-amber-50'
          : 'border-red-200/60 bg-red-50'
      }`}
    >
      <span className="flex items-center gap-4">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            isWarning ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}
        >
          <AlertCircle size={18} />
        </span>
        <span className={`font-bold ${isWarning ? 'text-amber-900' : 'text-red-900'}`}>
          {label}
        </span>
      </span>
      <span className={`text-sm font-bold ${isWarning ? 'text-amber-700' : 'text-red-700'}`}>
        {copy.workspace.configure}
      </span>
    </Link>
  );
}

export default function EventDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // All queries fire in parallel — no waterfall
  const query = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    staleTime: 30_000,
  });

  const readiness = useQuery({
    queryKey: ['event-publish-readiness', id],
    queryFn: () => eventsService.getPublishReadiness(id),
    enabled: Boolean(query.data),
    staleTime: 15_000,
  });

  const requestsQuery = useQuery({
    queryKey: ['event-access-requests', id],
    queryFn: () => eventsService.listAccessRequests(id),
    staleTime: 30_000,
  });

  const guestsQuery = useQuery({
    queryKey: guestKeys.page(id, 1),
    queryFn: () => guestsService.list(id),
    staleTime: 30_000,
  });

  const vendorsQuery = useQuery({
    queryKey: ['vendor-requests', id],
    queryFn: () => vendorRequestsService.listByEvent(id),
    staleTime: 30_000,
  });

  const invitationsQuery = useQuery({
    queryKey: ['event-invitations', id],
    queryFn: async () => {
      const res = await api.get<PaginatedOrganizerInvitations>(`/events/${id}/invitations`, {
        params: { page: 1, limit: 1 },
      });
      return res.data;
    },
    staleTime: 30_000,
  });

  const publish = useMutation({
    mutationFn: () => eventsService.publish(id),
    onSuccess: (event) => {
      queryClient.setQueryData(['event', id], event);
      void queryClient.invalidateQueries({ queryKey: ['my-events'] });
    },
  });

  if (query.isLoading)
    return (
      <div className="p-6">
        <div className="premium-skeleton h-72 rounded-3xl" />
      </div>
    );

  if (query.isError || !query.data)
    return (
      <section className="m-6 rounded-3xl border border-destructive/20 bg-white p-7 text-center">
        <AlertCircle className="mx-auto text-destructive" />
        <h1 className="mt-4 font-serif text-3xl text-event-petrol">Événement introuvable</h1>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="premium-button mt-5 px-6"
        >
          Réessayer
        </button>
      </section>
    );

  const event = query.data;
  const base = `/tableau-de-bord/evenements/${id}`;

  const statusMessage = STATUS_MESSAGES[event.status] ?? 'Gérez votre événement.';

  // KPI values — show "—" when data is unavailable, real value otherwise
  const guestsTotal = guestsQuery.isError ? '—' : guestsQuery.isLoading ? null : String(guestsQuery.data?.total ?? 0);
  const vendorsConfirmed = vendorsQuery.isError
    ? '—'
    : vendorsQuery.isLoading
      ? null
      : String(vendorsQuery.data?.filter((v) => v.status === 'accepted').length ?? 0);
  const invitationsCount = invitationsQuery.isError
    ? '—'
    : invitationsQuery.isLoading
      ? null
      : String(invitationsQuery.data?.total ?? 0);
  const pendingRequests = requestsQuery.isError
    ? '—'
    : requestsQuery.isLoading
      ? null
      : String(requestsQuery.data?.filter((r) => r.status === 'pending').length ?? 0);

  const errors = readiness.data?.errors ?? [];
  const warnings = readiness.data?.warnings ?? [];
  const isPublishable = readiness.data?.publishable ?? false;
  const isPublishDisabled = !isPublishable || publish.isPending || event.status === 'published';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Top status + publish section */}
      <section className="rounded-3xl bg-white p-6 shadow-event-soft sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-terracotta-pale px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-terracotta-dark">
                {STATUS_LABELS[event.status] ?? event.status}
              </span>
              {event.discoverability ? (
                <span className="rounded-full bg-event-surface px-3 py-1 text-xs font-bold text-event-muted">
                  {DISCOVERABILITY_LABELS[event.discoverability] ?? event.discoverability}
                </span>
              ) : null}
            </div>
            <h1 className="mt-5 break-words font-serif text-[clamp(2rem,5vw,3.6rem)] leading-none text-event-petrol [overflow-wrap:anywhere]">
              {event.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-event-muted">{statusMessage}</p>
            {event.startDate ? (
              <p className="mt-2 text-sm font-semibold text-event-teal">
                {formatEventDate(event.startDate)}
              </p>
            ) : null}
            {event.location?.city ?? event.location?.name ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-event-muted">
                <MapPin size={14} aria-hidden="true" />
                {event.location.city ?? event.location.name}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {event.slug && event.status === 'published' ? (
              <Link
                href={`/evenements/${event.slug}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-event-surface px-5 text-sm font-bold text-event-petrol"
              >
                <Eye size={16} />
                {copy.workspace.preview}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => publish.mutate()}
              disabled={isPublishDisabled}
              className="premium-button min-h-[44px] px-6 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {event.status === 'published' ? 'Événement publié' : copy.workspace.publish}
            </button>
          </div>
        </div>
        {publish.isError ? (
          <FormErrorAlert
            className="mt-5"
            error={getUserFacingError(publish.error, {
              fallback: "L’événement ne peut pas encore être publié. Vérifiez les éléments requis.",
            })}
          />
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        {/* Main column — readiness-driven action items */}
        <div className="space-y-6">
          <section>
            <h2 className="font-serif text-3xl text-event-petrol">{copy.workspace.now}</h2>
            <div className="mt-4 space-y-3">
              {readiness.isLoading ? (
                <div className="premium-skeleton h-20 rounded-3xl" />
              ) : readiness.isError ? (
                <div className="rounded-3xl bg-white p-5 shadow-event-soft">
                  <FormErrorAlert
                    error={getUserFacingError(readiness.error, {
                      fallback: "L'état de préparation est momentanément indisponible.",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => void readiness.refetch()}
                    className="premium-button-ghost mt-4 min-h-[44px] rounded-full px-5"
                  >
                    Réessayer
                  </button>
                </div>
              ) : errors.length === 0 && warnings.length === 0 ? (
                <div className="flex items-center gap-3 rounded-3xl bg-sage-pale p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sage-pale text-sage-dark">
                    <Check size={18} />
                  </span>
                  <p className="text-sm font-semibold text-sage-dark">
                    {event.status === 'published'
                      ? 'Votre événement est publié et visible.'
                      : 'Votre événement est prêt à être publié.'}
                  </p>
                </div>
              ) : (
                <>
                  {errors.map((err) => (
                    <ReadinessActionCard
                      key={typeof err === 'string' ? err : `${err.code}:${err.field}`}
                      error={err}
                      base={base}
                    />
                  ))}
                  {warnings.map((w) => (
                    <ReadinessActionCard key={w} error={w} base={base} isWarning />
                  ))}
                </>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar — KPI + configuration */}
        <aside className="space-y-4">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3">
            {guestsTotal === null ? (
              <KpiSkeleton />
            ) : (
              <KpiCard
                label="Participants"
                value={guestsTotal}
                icon={<Users size={18} />}
              />
            )}
            {vendorsConfirmed === null ? (
              <KpiSkeleton />
            ) : (
              <KpiCard
                label={copy.workspace.providersConfirmed}
                value={vendorsConfirmed}
                icon={<UsersRound size={18} />}
              />
            )}
            {invitationsCount === null ? (
              <KpiSkeleton />
            ) : (
              <KpiCard
                label={copy.workspace.invitations}
                value={invitationsCount}
                icon={<ShieldCheck size={18} />}
              />
            )}
            {pendingRequests === null ? (
              <KpiSkeleton />
            ) : (
              <KpiCard
                label="Demandes en attente"
                value={pendingRequests}
                icon={<AlertCircle size={18} />}
              />
            )}
          </div>

          {/* Public page link */}
          {event.slug && event.status === 'published' ? (
            <Link
              href={`/evenements/${event.slug}`}
              className="flex min-h-36 flex-col justify-end rounded-3xl bg-event-petrol p-6 text-white shadow-event-button"
            >
              <Eye size={24} />
              <span className="mt-6 font-serif text-2xl">Aperçu public</span>
              <span className="mt-1 text-sm text-white/65">Voir la page publiée</span>
            </Link>
          ) : null}

          {/* Current configuration */}
          <section className="rounded-3xl border border-event-outline-subtle/50 bg-white p-6">
            <h2 className="font-serif text-2xl text-event-petrol">{copy.workspace.currentConfiguration}</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <ConfigurationRow
                icon={<Eye size={17} />}
                label="Visibilité"
                value={DISCOVERABILITY_LABELS[event.discoverability ?? 'public'] ?? (event.discoverability ?? 'public')}
              />
              <ConfigurationRow
                icon={<ShieldCheck size={17} />}
                label="Accès"
                value={ACCESS_POLICY_LABELS[event.accessPolicy?.type ?? 'open'] ?? (event.accessPolicy?.type ?? 'open')}
              />
              <ConfigurationRow
                icon={<MapPin size={17} />}
                label="Lieu"
                value={event.location?.city ?? event.location?.name ?? 'À définir'}
              />
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  ArrowUpFromLine,
  Ban,
  Eye,
  ShieldCheck,
  Ticket,
  Trash2,
} from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import type { Event, EventStatus, AdmissionMode } from '@/features/events/types';
import { cn } from '@/shared/lib/utils';
import { ApiClientError } from '@/shared/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DialogKind = 'archive' | 'restore' | 'cancel' | 'delete' | null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

const STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  ongoing: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const STATUS_DESCRIPTIONS: Record<EventStatus, string> = {
  draft: "L'événement est en cours de création. Il n'est pas encore visible publiquement.",
  published: "L'événement est publié et visible par le public selon ses paramètres de découvrabilité.",
  ongoing: "L'événement est actuellement en cours.",
  completed: "L'événement s'est terminé. Il reste accessible en consultation.",
  cancelled: "L'événement a été annulé. Il n'est plus visible publiquement.",
};

const STATUS_VARIANT: Record<EventStatus, string> = {
  draft: 'bg-event-surface text-event-muted',
  published: 'bg-teal-pale text-teal-dark',
  ongoing: 'bg-teal-pale text-teal-dark',
  completed: 'bg-sage-pale text-sage-dark',
  cancelled: 'bg-terracotta-pale text-terracotta-dark',
};

const DISCOVERABILITY_LABELS: Record<string, string> = {
  public: 'Public — visible dans les résultats de recherche',
  unlisted: 'Non répertorié — accessible uniquement via lien direct',
  private: 'Privé — absent du catalogue public',
};

const ACCESS_POLICY_LABELS: Record<string, string> = {
  open: 'Accès libre',
  registration_required: 'Inscription requise',
  access_code: "Code d'accès",
  email_domain: 'Domaine e-mail autorisé',
  manual_approval: 'Approbation manuelle',
  guest_list: "Liste d'invités",
  invitation_token: 'Invitation uniquement',
};

const ADMISSION_LABELS: Record<AdmissionMode, string> = {
  free: 'Entrée libre',
  registration_only: 'Inscription sans billet',
  free_ticket: 'Billet gratuit',
  paid_ticket: 'Billet payant',
  invitation: 'Sur invitation',
};

// ---------------------------------------------------------------------------
// ConfirmDialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onRestoreFocus?: () => void;
  destructive?: boolean;
  children?: React.ReactNode;
}

function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  confirmDisabled = false,
  isPending = false,
  onConfirm,
  onRestoreFocus,
  destructive = false,
  children,
}: ConfirmDialogProps) {
  // Focus the cancel button on open so ESC + Tab flow is natural
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-primary/30 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>

            <Dialog.Content
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  onClose();
                }
              }}
              onEscapeKeyDown={(event) => {
                event.preventDefault();
                onClose();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                onRestoreFocus?.();
              }}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                cancelRef.current?.focus();
              }}
              asChild
            >
              <motion.div
                className={cn(
                  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                  'w-[calc(100vw-2rem)] max-w-lg rounded-[20px] p-5 sm:p-7',
                  'bg-white/90 backdrop-blur-[20px]',
                  'shadow-[0px_12px_32px_rgba(13,30,53,0.14)]',
                  'focus:outline-none',
                )}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <Dialog.Title className="font-serif text-xl text-event-petrol">
                  {title}
                </Dialog.Title>

                <Dialog.Description className="mt-3 text-sm leading-6 text-event-muted">
                  {description}
                </Dialog.Description>

                {children && <div className="mt-5">{children}</div>}

                <div className="mt-6 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <button
                      ref={cancelRef}
                      type="button"
                      className="inline-flex min-h-[44px] items-center rounded-full bg-event-surface px-5 text-sm font-semibold text-event-petrol transition-colors hover:bg-event-surface/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-teal"
                    >
                      {cancelLabel}
                    </button>
                  </Dialog.Close>

                  <button
                    type="button"
                    disabled={confirmDisabled || isPending}
                    onClick={onConfirm}
                    className={cn(
                      'inline-flex min-h-[44px] items-center rounded-full px-5 text-sm font-semibold transition-all',
                      'focus-visible:outline-2 focus-visible:outline-offset-2',
                      'disabled:cursor-not-allowed disabled:opacity-40',
                      destructive
                        ? 'bg-red-800 text-white hover:bg-red-900 focus-visible:outline-red-800'
                        : 'bg-event-petrol text-white hover:bg-event-petrol/90 focus-visible:outline-event-petrol',
                    )}
                  >
                    {isPending ? 'En cours…' : confirmLabel}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  children,
  danger = false,
  className,
}: {
  children: React.ReactNode;
  danger?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        danger
          ? 'rounded-3xl bg-red-50/70 p-6 shadow-event-soft'
          : 'rounded-3xl bg-white p-6 shadow-event-soft',
        className,
      )}
    >
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// InfoRow
// ---------------------------------------------------------------------------

function InfoRow({
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
      <span className="row-span-2 mt-0.5 text-event-teal" aria-hidden="true">
        {icon}
      </span>
      <dt className="font-bold text-event-petrol">{label}</dt>
      <dd className="mt-0.5 text-sm text-event-muted">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EventSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [openDialog, setOpenDialog] = useState<DialogKind>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const openConfirmation = (kind: Exclude<DialogKind, null>, trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger;
    setOpenDialog(kind);
  };
  const restoreFocus = () => returnFocusRef.current?.focus();

  const query = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    staleTime: 30_000,
  });

  const archiveMutation = useMutation({
    mutationFn: () => eventsService.archive(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['my-events'] });
      setOpenDialog(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => eventsService.restore(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['my-events'] });
      setOpenDialog(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-events'] });
      router.push('/tableau-de-bord/evenements');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => eventsService.cancel(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['my-events'] });
      void queryClient.invalidateQueries({ queryKey: ['organizer-dashboard-summary'] });
      setOpenDialog(null);
    },
  });

  const closeDialog = useCallback(() => {
    setOpenDialog(null);
    setDeleteConfirmed(false);
  }, []);

  // Loading / error states
  if (query.isLoading) {
    return (
      <div className="p-6">
        <div className="premium-skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="m-6 rounded-3xl bg-terracotta-pale/70 p-7 text-center shadow-event-soft">
        <AlertTriangle className="mx-auto text-terracotta-dark" />
        <h1 className="mt-4 font-serif text-3xl text-event-petrol">
          Événement introuvable
        </h1>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="premium-button mt-5 px-6"
        >
          Réessayer
        </button>
      </section>
    );
  }

  const event: Event = query.data;
  const isArchived = Boolean(event.archivedAt);
  const canCancel = ['published', 'ongoing'].includes(event.status);
  const canDelete = event.status === 'draft';
  const isTerminal = ['completed', 'cancelled'].includes(event.status);
  const cancellationBlockedByPaidOrders =
    cancelMutation.error instanceof ApiClientError &&
    JSON.stringify(cancelMutation.error.payload).includes(
      'EVENT_CANCELLATION_BLOCKED_BY_PAID_ORDERS',
    );
  const base = `/tableau-de-bord/evenements/${id}`;

  const admissions =
    event.admissionModes && event.admissionModes.length > 0
      ? event.admissionModes.map((m) => ADMISSION_LABELS[m] ?? m).join(', ')
      : 'Non défini';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="mb-6">
        <p className="section-eyebrow mb-3">Espace organisateur</p>
        <h1 className="font-serif text-[clamp(2.4rem,5vw,4rem)] leading-none text-event-petrol">
          Paramètres
        </h1>
        <p className="mt-3 text-base text-event-muted">{event.title}</p>
      </header>

      <div className="space-y-5">
        {/* ── Section 1 : Statut ──────────────────────────────────────── */}
        <Section>
          <h2 className="font-serif text-2xl text-event-petrol">
            Statut de l&apos;événement
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-bold',
                STATUS_VARIANT[event.status] ??
                  'bg-event-surface text-event-muted',
              )}
            >
              {STATUS_LABELS[event.status] ?? event.status}
            </span>
            {isArchived && (
              <span className="rounded-full bg-event-surface px-4 py-1.5 text-sm font-bold text-event-muted">
                Archivé
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-event-muted">
            {STATUS_DESCRIPTIONS[event.status] ??
              "Gérez les paramètres de cet événement."}
          </p>

          {isArchived && event.archivedAt ? (
            <p className="mt-3 text-sm text-event-muted">
              Archivé le{' '}
              <span className="font-semibold text-event-petrol">
                {formatDate(event.archivedAt)}
              </span>
              .
            </p>
          ) : null}
        </Section>

        {/* ── Section 2 : Archivage ───────────────────────────────────── */}
        <Section>
          <h2 className="font-serif text-2xl text-event-petrol">Archivage</h2>

          {isArchived ? (
            <>
              <p className="mt-4 text-sm leading-6 text-event-muted">
                Cet événement est archivé{' '}
                {event.archivedAt ? (
                  <>
                    depuis le{' '}
                    <span className="font-semibold text-event-petrol">
                      {formatDate(event.archivedAt)}
                    </span>
                  </>
                ) : null}
                . Il n&apos;est plus visible publiquement. Vous pouvez le
                restaurer à tout moment.
              </p>

              {restoreMutation.isError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-2xl bg-terracotta-pale px-4 py-3 text-sm font-medium text-terracotta-dark"
                >
                  Une erreur est survenue. Veuillez réessayer.
                </p>
              ) : null}

              <div className="mt-5">
                <button
                  type="button"
                  onClick={(event) => openConfirmation('restore', event.currentTarget)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-event-surface px-5 text-sm font-semibold text-event-petrol transition-colors hover:bg-event-surface/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-teal"
                >
                  <ArrowUpFromLine size={16} aria-hidden="true" />
                  Restaurer l&apos;événement
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-event-muted">
                Archiver l&apos;événement le masque du public tout en conservant
                toutes ses données. Vous pourrez le restaurer à tout moment.
              </p>

              {archiveMutation.isError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-2xl bg-terracotta-pale px-4 py-3 text-sm font-medium text-terracotta-dark"
                >
                  Une erreur est survenue. Veuillez réessayer.
                </p>
              ) : null}

              <div className="mt-5">
                <button
                  type="button"
                  onClick={(event) => openConfirmation('archive', event.currentTarget)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-event-surface px-5 text-sm font-semibold text-event-petrol transition-colors hover:bg-event-surface/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-teal"
                >
                  <Archive size={16} aria-hidden="true" />
                  Archiver l&apos;événement
                </button>
              </div>
            </>
          )}
        </Section>

        {/* ── Section 3 : Configuration d'accès ─────────────────────── */}
        <Section>
          <h2 className="font-serif text-2xl text-event-petrol">
            Configuration de l&apos;accès
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <InfoRow
              icon={<Eye size={17} />}
              label="Découvrabilité"
              value={
                DISCOVERABILITY_LABELS[event.discoverability ?? 'public'] ??
                (event.discoverability ?? 'public')
              }
            />
            <InfoRow
              icon={<ShieldCheck size={17} />}
              label="Politique d'accès"
              value={
                ACCESS_POLICY_LABELS[event.accessPolicy?.type ?? 'open'] ??
                (event.accessPolicy?.type ?? 'open')
              }
            />
            <InfoRow
              icon={<Ticket size={17} />}
              label="Mode d'admission"
              value={admissions}
            />
          </dl>

          {!isTerminal ? <div className="mt-6">
            <Link
              href={`${base}/acces-et-inscriptions`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-event-surface px-5 text-sm font-semibold text-event-petrol transition-colors hover:bg-event-surface/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-event-teal"
            >
              Gérer la configuration d&apos;accès
            </Link>
          </div> : null}
        </Section>

        {/* ── Section 4 : Zone de danger ──────────────────────────────── */}
        <Section danger>
          <h2 className="font-serif text-2xl text-red-700">Zone de danger</h2>
          <p className="mt-3 text-sm leading-6 text-red-700/80">
            {canDelete
              ? 'Seul un brouillon peut être supprimé définitivement.'
              : canCancel
                ? "L’annulation retire l’événement des surfaces publiques. Elle ne déclenche aucun remboursement automatique."
                : 'Cet événement est dans un état terminal et reste disponible en consultation.'}
          </p>

          {cancelMutation.isError ? (
            <p role="alert" className="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
              {cancellationBlockedByPaidOrders
                ? 'La billetterie payante est configurée ou une commande en attente/payée existe. L’annulation est bloquée tant que ce risque financier n’est pas résolu.'
                : 'L’annulation a échoué. Actualisez la page puis réessayez.'}
            </p>
          ) : null}

          {deleteMutation.isError ? (
            <p
              role="alert"
              className="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700"
            >
              La suppression a échoué. Veuillez réessayer.
            </p>
          ) : null}

          {canCancel ? <div className="mt-5">
            <button
              type="button"
              onClick={(event) => openConfirmation('cancel', event.currentTarget)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-red-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
            >
              <Ban size={16} aria-hidden="true" />
              Annuler l&apos;événement
            </button>
          </div> : null}

          {canDelete ? <div className="mt-5">
            <button
              type="button"
              onClick={(event) => openConfirmation('delete', event.currentTarget)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-red-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
            >
              <Trash2 size={16} aria-hidden="true" />
              Supprimer définitivement l&apos;événement
            </button>
          </div> : null}
        </Section>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}

      {/* Archive */}
      <ConfirmDialog
        open={openDialog === 'archive'}
        onClose={closeDialog}
        onRestoreFocus={restoreFocus}
        title={`Archiver « ${event.title} » ?`}
        description={`L'événement ne sera plus visible publiquement mais sera conservé. Vous pourrez le restaurer à tout moment.`}
        confirmLabel="Archiver"
        isPending={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
      />

      {/* Restore */}
      <ConfirmDialog
        open={openDialog === 'restore'}
        onClose={closeDialog}
        onRestoreFocus={restoreFocus}
        title={`Restaurer « ${event.title} » ?`}
        description="L'événement redeviendra visible selon ses paramètres de découvrabilité actuels."
        confirmLabel="Restaurer"
        isPending={restoreMutation.isPending}
        onConfirm={() => restoreMutation.mutate()}
      />

      {/* Delete */}
      <ConfirmDialog
        open={openDialog === 'cancel'}
        onClose={closeDialog}
        onRestoreFocus={restoreFocus}
        title={`Annuler « ${event.title} » ?`}
        description="L’événement sera retiré du public et les personnes concernées seront informées. Aucun remboursement n’est lancé automatiquement. Une admission payante configurée ou des commandes en attente/payées bloquent cette opération."
        confirmLabel="Annuler l’événement"
        cancelLabel="Conserver l’événement"
        isPending={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        destructive
      />

      <ConfirmDialog
        open={openDialog === 'delete'}
        onClose={closeDialog}
        onRestoreFocus={restoreFocus}
        title={`Supprimer définitivement « ${event.title} » ?`}
        description="Cette action supprime définitivement l'événement. Les données associées peuvent rester conservées selon les règles de rétention du service."
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        confirmDisabled={!deleteConfirmed}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        destructive
      >
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
            className="h-5 w-5 cursor-pointer rounded accent-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          />
          <span className="text-sm font-medium text-event-petrol">
            Je confirme vouloir supprimer définitivement cet événement
          </span>
        </label>
      </ConfirmDialog>
    </div>
  );
}

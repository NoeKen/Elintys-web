'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2, Plus, AlertCircle, Tag } from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import {
  ticketsService,
  type CreateTicketTypeDto,
  type UpdateTicketTypeDto,
} from '@/features/tickets/services/tickets.service';
import type { TicketType } from '@/features/tickets/types';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { cn } from '@/shared/lib/utils';

// ─── Schema ──────────────────────────────────────────────────────────────────

const ticketTypeSchema = z
  .object({
    name: z.string().min(1, 'Requis').max(120, 'Maximum 120 caractères'),
    description: z.string().max(500, 'Maximum 500 caractères').optional(),
    isFree: z.boolean(),
    price: z.number().int().min(0).max(1_000_000),
    quantity: z.number().int().min(1, 'Minimum 1').max(100_000, 'Maximum 100 000'),
  })
  .refine((d) => d.isFree || d.price > 0, {
    message: 'Indiquez un prix supérieur à 0, ou cochez « Gratuit ».',
    path: ['price'],
  });

type TicketTypeFormValues = z.infer<typeof ticketTypeSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPriceCAD(cents: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TicketFormProps {
  defaultValues?: Partial<TicketTypeFormValues>;
  onSubmit: (values: TicketTypeFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
  submitError: unknown;
  submitLabel: string;
}

function TicketTypeForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
  submitError,
  submitLabel,
}: TicketFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<TicketTypeFormValues>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      isFree: false,
      price: 0,
      quantity: 100,
      ...defaultValues,
    },
  });

  const isFree = useWatch({ control, name: 'isFree' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tt-name" className="text-sm font-medium text-on-surface">
          Nom du billet <span className="text-destructive" aria-hidden="true">*</span>
        </label>
        <input
          id="tt-name"
          type="text"
          placeholder="Ex : Billet régulier, VIP, Étudiant…"
          className={cn(
            'h-10 w-full rounded-[8px] border bg-surface-lowest px-3 text-sm text-on-surface',
            'placeholder:text-on-surface-variant transition-all duration-200',
            'focus:outline-2 focus:outline-accent focus:outline-offset-0',
            errors.name ? 'border-destructive' : 'border-outline-variant',
          )}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tt-description" className="text-sm font-medium text-on-surface">
          Description <span className="text-on-surface-variant font-normal">(optionnel)</span>
        </label>
        <textarea
          id="tt-description"
          rows={2}
          placeholder="Avantages, restrictions, informations importantes…"
          className={cn(
            'w-full rounded-[8px] border border-outline-variant bg-surface-lowest px-3 py-2 text-sm text-on-surface',
            'placeholder:text-on-surface-variant transition-all duration-200 resize-none',
            'focus:outline-2 focus:outline-accent focus:outline-offset-0',
            errors.description ? 'border-destructive' : 'border-outline-variant',
          )}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Price + free toggle */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tt-price" className="text-sm font-medium text-on-surface">
            Prix (en cents) <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="tt-price"
            type="number"
            min={0}
            step={1}
            disabled={isFree}
            placeholder="Ex : 2500 = 25,00 $"
            className={cn(
              'h-10 w-full rounded-[8px] border bg-surface-lowest px-3 text-sm text-on-surface',
              'placeholder:text-on-surface-variant transition-all duration-200',
              'focus:outline-2 focus:outline-accent focus:outline-offset-0 disabled:opacity-50',
              errors.price ? 'border-destructive' : 'border-outline-variant',
            )}
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tt-quantity" className="text-sm font-medium text-on-surface">
            Quantité <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="tt-quantity"
            type="number"
            min={1}
            step={1}
            className={cn(
              'h-10 w-full rounded-[8px] border bg-surface-lowest px-3 text-sm text-on-surface',
              'placeholder:text-on-surface-variant transition-all duration-200',
              'focus:outline-2 focus:outline-accent focus:outline-offset-0',
              errors.quantity ? 'border-destructive' : 'border-outline-variant',
            )}
            {...register('quantity', { valueAsNumber: true })}
          />
          {errors.quantity && (
            <p className="text-xs text-destructive">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      {/* Free toggle */}
      <label className="flex min-h-[44px] items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-outline-variant accent-teal"
          {...register('isFree')}
          onChange={(e) => {
            setValue('isFree', e.target.checked);
            if (e.target.checked) setValue('price', 0);
          }}
        />
        <span className="text-sm font-medium text-on-surface">Billet gratuit</span>
      </label>

      {submitError ? (
        <FormErrorAlert
          error={getUserFacingError(submitError, {
            fallback: "Impossible d'enregistrer ce type de billet.",
          })}
        />
      ) : null}

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="outline" size="md" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" size="md" loading={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ─── Ticket type card ─────────────────────────────────────────────────────────

interface TicketTypeCardProps {
  ticketType: TicketType;
  onEdit: (tt: TicketType) => void;
  onDelete: (tt: TicketType) => void;
}

function TicketTypeCard({ ticketType, onEdit, onDelete }: TicketTypeCardProps) {
  const remaining = ticketType.quantity - ticketType.soldCount;
  const soldOut = remaining <= 0;

  return (
    <article className="rounded-3xl bg-white p-6 shadow-event-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-xl text-event-petrol">{ticketType.name}</h3>
            {ticketType.price === 0 ? (
              <span className="rounded-full bg-teal-pale px-2.5 py-0.5 text-xs font-bold text-teal-dark">
                Gratuit
              </span>
            ) : (
              <span className="rounded-full bg-terracotta-pale px-2.5 py-0.5 text-xs font-bold text-terracotta-dark">
                {formatPriceCAD(ticketType.price)}
              </span>
            )}
            {soldOut && (
              <span className="rounded-full bg-event-surface px-2.5 py-0.5 text-xs font-bold text-event-muted">
                Épuisé
              </span>
            )}
          </div>
          {ticketType.description ? (
            <p className="mt-1.5 text-sm leading-6 text-event-muted line-clamp-2">
              {ticketType.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={`Modifier ${ticketType.name}`}
            onClick={() => onEdit(ticketType)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/60 text-on-surface-variant hover:bg-event-surface focus-visible:outline-2 focus-visible:outline-accent transition-colors"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Supprimer ${ticketType.name}`}
            onClick={() => onDelete(ticketType)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/60 text-destructive/70 hover:bg-destructive/8 focus-visible:outline-2 focus-visible:outline-destructive transition-colors"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Inventory bar */}
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-event-surface px-3 py-2.5">
          <p className="font-serif text-2xl text-event-petrol">{ticketType.quantity}</p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.1em] text-event-muted">
            Total
          </p>
        </div>
        <div className="rounded-2xl bg-event-surface px-3 py-2.5">
          <p className="font-serif text-2xl text-event-petrol">{ticketType.soldCount}</p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.1em] text-event-muted">
            Vendus
          </p>
        </div>
        <div
          className={cn(
            'rounded-2xl px-3 py-2.5',
            soldOut ? 'bg-destructive/8' : 'bg-event-surface',
          )}
        >
          <p
            className={cn(
              'font-serif text-2xl',
              soldOut ? 'text-destructive' : 'text-event-petrol',
            )}
          >
            {remaining}
          </p>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.1em] text-event-muted">
            Disponibles
          </p>
        </div>
      </div>
    </article>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyTicketState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white px-8 py-16 text-center shadow-event-soft">
      <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-teal-pale text-teal">
        <Tag size={28} aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-serif text-2xl text-event-petrol">Aucun type de billet configuré</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-event-muted">
        Ajoutez le premier pour commencer la vente.
      </p>
      <Button
        type="button"
        variant="primary"
        size="md"
        className="mt-7"
        icon={<Plus size={16} aria-hidden="true" />}
        onClick={onAdd}
      >
        Ajouter un billet
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventBilletteriePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingType, setEditingType] = useState<TicketType | null>(null);
  const [deletingType, setDeletingType] = useState<TicketType | null>(null);

  // Queries
  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.get(id),
    staleTime: 30_000,
  });

  const typesQuery = useQuery({
    queryKey: ['ticket-types', id],
    queryFn: () => ticketsService.getTypes(id),
    staleTime: 30_000,
    enabled: Boolean(id),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (dto: CreateTicketTypeDto) => ticketsService.createType(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket-types', id] });
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ typeId, dto }: { typeId: string; dto: UpdateTicketTypeDto }) =>
      ticketsService.updateType(typeId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket-types', id] });
      setEditingType(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (typeId: string) => ticketsService.deleteType(typeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket-types', id] });
      setDeletingType(null);
    },
  });

  const handleCreate = (values: TicketTypeFormValues) => {
    const dto: CreateTicketTypeDto = {
      name: values.name,
      description: values.description || undefined,
      isFree: values.isFree,
      price: values.isFree ? 0 : values.price,
      quantity: values.quantity,
    };
    createMutation.mutate(dto);
  };

  const handleUpdate = (values: TicketTypeFormValues) => {
    if (!editingType) return;
    const dto: UpdateTicketTypeDto = {
      name: values.name,
      description: values.description || undefined,
      isFree: values.isFree,
      price: values.isFree ? 0 : values.price,
      quantity: values.quantity,
    };
    updateMutation.mutate({ typeId: editingType.id, dto });
  };

  const confirmDelete = () => {
    if (!deletingType) return;
    deleteMutation.mutate(deletingType.id);
  };

  const ticketTypes = typesQuery.data ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-event-teal">
          Billetterie
        </p>
        <h1 className="mt-1 font-serif text-[clamp(2rem,4vw,3rem)] leading-none text-event-petrol">
          Types de billets
        </h1>
        {eventQuery.data?.title ? (
          <p className="mt-2 text-sm text-event-muted">{eventQuery.data.title}</p>
        ) : null}
      </header>

      {/* Loading skeleton */}
      {typesQuery.isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="premium-skeleton h-52 rounded-3xl" />
          ))}
        </div>
      ) : typesQuery.isError ? (
        <section className="rounded-3xl border border-destructive/20 bg-white p-7 text-center shadow-event-soft">
          <AlertCircle className="mx-auto text-destructive" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-2xl text-event-petrol">
            Impossible de charger les types de billets
          </h2>
          <Button
            type="button"
            variant="outline"
            size="md"
            className="mt-5"
            onClick={() => void typesQuery.refetch()}
          >
            Réessayer
          </Button>
        </section>
      ) : (
        <>
          {/* Ticket type list */}
          {ticketTypes.length === 0 && !showAddForm ? (
            <EmptyTicketState onAdd={() => setShowAddForm(true)} />
          ) : (
            <div className="space-y-4">
              {ticketTypes.map((tt) => (
                <TicketTypeCard
                  key={tt.id}
                  ticketType={tt}
                  onEdit={(t) => {
                    setEditingType(t);
                    setShowAddForm(false);
                  }}
                  onDelete={setDeletingType}
                />
              ))}
            </div>
          )}

          {/* Add ticket type form — inline below list */}
          {showAddForm ? (
            <div className="mt-4 rounded-3xl bg-white p-6 shadow-event-soft">
              <h2 className="mb-5 font-serif text-xl text-event-petrol">
                Nouveau type de billet
              </h2>
              <TicketTypeForm
                onSubmit={handleCreate}
                onCancel={() => setShowAddForm(false)}
                isPending={createMutation.isPending}
                submitError={createMutation.error}
                submitLabel="Créer le billet"
              />
            </div>
          ) : (
            ticketTypes.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  icon={<Plus size={16} aria-hidden="true" />}
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingType(null);
                  }}
                >
                  Ajouter un type de billet
                </Button>
              </div>
            )
          )}
        </>
      )}

      {/* Edit dialog */}
      <Modal
        open={Boolean(editingType)}
        onOpenChange={(open) => {
          if (!open) setEditingType(null);
        }}
        title="Modifier le type de billet"
      >
        {editingType ? (
          <TicketTypeForm
            defaultValues={{
              name: editingType.name,
              description: editingType.description,
              isFree: editingType.price === 0,
              price: editingType.price,
              quantity: editingType.quantity,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingType(null)}
            isPending={updateMutation.isPending}
            submitError={updateMutation.error}
            submitLabel="Enregistrer les modifications"
          />
        ) : null}
      </Modal>

      {/* Delete confirmation dialog */}
      <Modal
        open={Boolean(deletingType)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeletingType(null);
        }}
        title="Supprimer ce type de billet ?"
        description={
          deletingType
            ? `« ${deletingType.name} » sera définitivement supprimé. Cette action est irréversible.`
            : undefined
        }
      >
        {deleteMutation.isError ? (
          <FormErrorAlert
            className="mb-4"
            error={getUserFacingError(deleteMutation.error, {
              fallback: 'Impossible de supprimer ce type de billet.',
            })}
          />
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setDeletingType(null)}
            disabled={deleteMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="md"
            loading={deleteMutation.isPending}
            onClick={confirmDelete}
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}

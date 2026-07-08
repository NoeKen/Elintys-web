'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { guestsService, type Guest } from '@/features/guests/services/guests.service';
import { useAuthToken } from '@/server/auth/use-auth-token';
import { cn } from '@/shared/lib/utils';

const addSchema = z.object({
  name: z.string().min(1, 'Requis').max(100),
  email: z.string().email('Courriel invalide').optional().or(z.literal('')),
  note: z.string().max(500).optional(),
});

type AddFormValues = z.infer<typeof addSchema>;

const STATUS_LABELS: Record<Guest['status'], string> = {
  invited: 'Invité',
  confirmed: 'Confirmé',
  declined: 'Refusé',
  present: 'Présent',
};

const STATUS_CLASSES: Record<Guest['status'], string> = {
  invited: 'bg-surface border border-border text-muted',
  confirmed: 'bg-teal text-white',
  declined: 'bg-red-100 text-red-600',
  present: 'bg-navy text-white',
};

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['guests', id],
    queryFn: () => guestsService.list(token, id),
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: (values: AddFormValues) =>
      guestsService.add(token, id, {
        name: values.name,
        email: values.email || undefined,
        note: values.note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', id] });
      setShowForm(false);
      reset();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ guestId, status }: { guestId: string; status: Guest['status'] }) =>
      guestsService.updateStatus(token, id, guestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', id] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (guestId: string) => guestsService.remove(token, id, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', id] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: '', email: '', note: '' },
  });

  const onSubmit = (values: AddFormValues) => {
    addMutation.mutate(values);
  };

  if (isLoading) return <div className="p-8 text-muted animate-pulse">Chargement…</div>;
  if (isError) return <div className="p-8 text-red-500">Erreur lors du chargement des invités.</div>;

  const guests = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-navy">Invités</h1>
        <button
          type="button"
          onClick={() => setShowForm(prev => !prev)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            showForm
              ? 'bg-surface border border-border text-muted'
              : 'bg-teal text-white hover:opacity-90',
          )}
        >
          {showForm ? 'Annuler' : 'Ajouter un invité'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 border border-border rounded-xl p-5 bg-surface space-y-4"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-navy mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="Prénom Nom"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-navy mb-1">
              Courriel
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="exemple@courriel.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-navy mb-1">
              Note
            </label>
            <textarea
              id="note"
              {...register('note')}
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
              placeholder="Note optionnelle…"
            />
            {errors.note && (
              <p className="mt-1 text-xs text-red-500">{errors.note.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || addMutation.isPending}
            className="rounded-lg bg-teal text-white px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {addMutation.isPending ? 'Ajout…' : 'Ajouter'}
          </button>

          {addMutation.isError && (
            <p className="text-xs text-red-500">Erreur lors de l&apos;ajout. Veuillez réessayer.</p>
          )}
        </form>
      )}

      {guests.length === 0 ? (
        <p className="text-muted text-sm text-center py-12">Aucun invité pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {guests.map(guest => (
            <li
              key={guest._id}
              className="border border-border rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-navy truncate">{guest.name}</p>
                {guest.email && (
                  <p className="text-sm text-muted truncate">{guest.email}</p>
                )}
                {guest.note && (
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{guest.note}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
                    STATUS_CLASSES[guest.status],
                  )}
                >
                  {STATUS_LABELS[guest.status]}
                </span>

                <select
                  aria-label={`Changer le statut de ${guest.name}`}
                  value={guest.status}
                  onChange={e =>
                    statusMutation.mutate({
                      guestId: guest._id,
                      status: e.target.value as Guest['status'],
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="text-xs border border-border rounded-lg px-2 py-1 bg-surface text-navy focus:outline-none focus:ring-2 focus:ring-teal disabled:opacity-50"
                >
                  <option value="invited">Invité</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="declined">Refusé</option>
                  <option value="present">Présent</option>
                </select>

                <button
                  type="button"
                  aria-label={`Retirer ${guest.name}`}
                  onClick={() => removeMutation.mutate(guest._id)}
                  disabled={removeMutation.isPending}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors px-2 py-1 rounded"
                >
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

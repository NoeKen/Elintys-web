'use client';

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import { useAuthToken } from '@/server/auth/use-auth-token';
import { venueProfileService } from '@/features/venues/services/venue-profile.service';

const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(3000).optional(),
  capacity: z.coerce.number().int().min(1),
  pricePerDay: z.coerce.number().min(0).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional(),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postalCode: z.string().max(10).optional(),
});

interface FormValues {
  name: string;
  description?: string;
  capacity: number;
  pricePerDay?: number;
  contactEmail?: string;
  contactPhone?: string;
  street: string;
  city: string;
  postalCode?: string;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function GestionnaireFichePage() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['venue-profile-me'],
    queryFn: () => venueProfileService.getMyProfile(token),
    enabled: Boolean(token),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) as Resolver<FormValues> });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        description: profile.description ?? '',
        capacity: profile.capacity,
        pricePerDay: profile.pricePerDay,
        contactEmail: profile.contactEmail ?? '',
        contactPhone: profile.contactPhone ?? '',
        street: profile.address.street,
        city: profile.address.city,
        postalCode: profile.address.postalCode ?? '',
      });
    }
  }, [profile, reset]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: FormValues) =>
      venueProfileService.updateProfile(token, {
        name: data.name,
        description: data.description,
        capacity: data.capacity,
        pricePerDay: data.pricePerDay,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        address: {
          street: data.street,
          city: data.city,
          province: 'QC',
          postalCode: data.postalCode || undefined,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['venue-profile-me'] });
      setSuccessMsg('Fiche mise a jour avec succes.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setSuccessMsg('');
    mutate(data);
  };

  const inputClass = cn(
    'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-navy placeholder:text-muted',
    'focus:outline-none focus:ring-2 focus:ring-teal',
  );

  const labelClass = 'block mb-1 text-sm font-medium text-navy';

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <p className="text-sm text-muted">Chargement de la fiche...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-8">
        <p className="text-sm text-red-500">
          Impossible de charger votre fiche lieu. Veuillez reessayer.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy">Ma fiche lieu</h1>
        <p className="mt-1 text-sm text-muted">
          Mettez a jour la presentation de votre lieu, ses capacites et ses services.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5 rounded-xl border border-border bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="name" className={labelClass}>
            Nom du lieu <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={inputClass}
            placeholder="Salle Pleyel, Le Balthazar..."
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            rows={5}
            {...register('description')}
            className={cn(inputClass, 'resize-none')}
            placeholder="Decrivez votre lieu (histoire, ambiance, services...)..."
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="capacity" className={labelClass}>
              Capacite (personnes) <span className="text-red-500">*</span>
            </label>
            <input
              id="capacity"
              type="number"
              min={1}
              {...register('capacity')}
              className={inputClass}
              placeholder="200"
            />
            <FieldError message={errors.capacity?.message} />
          </div>

          <div>
            <label htmlFor="pricePerDay" className={labelClass}>
              Prix par jour (CAD)
            </label>
            <input
              id="pricePerDay"
              type="number"
              min={0}
              step="0.01"
              {...register('pricePerDay')}
              className={inputClass}
              placeholder="1500"
            />
            <FieldError message={errors.pricePerDay?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactEmail" className={labelClass}>
              Email de contact
            </label>
            <input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              className={inputClass}
              placeholder="contact@lieu.ca"
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>

          <div>
            <label htmlFor="contactPhone" className={labelClass}>
              Telephone de contact
            </label>
            <input
              id="contactPhone"
              type="tel"
              {...register('contactPhone')}
              className={inputClass}
              placeholder="514-555-0100"
            />
            <FieldError message={errors.contactPhone?.message} />
          </div>
        </div>

        <hr className="border-border" />

        <p className="text-sm font-semibold text-navy">Adresse</p>

        <div>
          <label htmlFor="street" className={labelClass}>
            Rue <span className="text-red-500">*</span>
          </label>
          <input
            id="street"
            type="text"
            {...register('street')}
            className={inputClass}
            placeholder="123, rue Sainte-Catherine"
          />
          <FieldError message={errors.street?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className={labelClass}>
              Ville <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              {...register('city')}
              className={inputClass}
              placeholder="Montreal"
            />
            <FieldError message={errors.city?.message} />
          </div>

          <div>
            <label htmlFor="postalCode" className={labelClass}>
              Code postal
            </label>
            <input
              id="postalCode"
              type="text"
              {...register('postalCode')}
              className={inputClass}
              placeholder="H2X 1Y5"
            />
            <FieldError message={errors.postalCode?.message} />
          </div>
        </div>

        {error instanceof Error && (
          <p className="text-sm text-red-500">{error.message}</p>
        )}

        {successMsg && (
          <p className="text-sm font-medium text-teal">{successMsg}</p>
        )}

        <button
          type="submit"
          disabled={isPending || isSubmitting}
          className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}

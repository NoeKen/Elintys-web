'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthToken } from '@/server/auth/use-auth-token';
import { vendorProfileService } from '@/features/vendors/services/vendor-profile.service';
import { cn } from '@/shared/lib/utils';

const profileSchema = z.object({
  businessName: z.string().min(1, 'Le nom commercial est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  description: z.string().optional(),
  serviceArea: z.string().optional(),
  contactEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function PrestataireProfilPage() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['vendor-profile-mine'],
    queryFn: () => vendorProfileService.getMyProfile(token),
    enabled: !!token,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: '',
      category: '',
      description: '',
      serviceArea: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        businessName: profile.businessName ?? '',
        category: profile.category ?? '',
        description: profile.description ?? '',
        serviceArea: profile.serviceArea ?? '',
        contactEmail: profile.contactEmail ?? '',
        contactPhone: profile.contactPhone ?? '',
      });
    }
  }, [profile, reset]);

  const { mutate: save, isPending, isSuccess, isError } = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      vendorProfileService.updateProfile(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile-mine'] });
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    save(values);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-muted text-sm">Chargement du profil...</div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-navy">Mon profil prestataire</h1>
        <p className="text-muted text-sm mt-1">
          Gerez votre fiche prestataire, vos services et vos informations publiques.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-surface border border-border rounded-xl p-6 space-y-5"
      >
        <div className="space-y-1">
          <label htmlFor="businessName" className="text-sm font-medium text-navy">
            Nom commercial <span className="text-red-500">*</span>
          </label>
          <input
            id="businessName"
            type="text"
            {...register('businessName')}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy',
              'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal',
              errors.businessName ? 'border-red-500' : 'border-border',
            )}
            placeholder="Ex: Productions Lumiere"
          />
          {errors.businessName && (
            <p className="text-xs text-red-500">{errors.businessName.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="category" className="text-sm font-medium text-navy">
            Categorie <span className="text-red-500">*</span>
          </label>
          <input
            id="category"
            type="text"
            {...register('category')}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy',
              'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal',
              errors.category ? 'border-red-500' : 'border-border',
            )}
            placeholder="Ex: Photographie, DJ, Traiteur..."
          />
          {errors.category && (
            <p className="text-xs text-red-500">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium text-navy">
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            className={cn(
              'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy',
              'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal resize-none',
            )}
            placeholder="Decrivez vos services..."
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="serviceArea" className="text-sm font-medium text-navy">
            Zone de service
          </label>
          <input
            id="serviceArea"
            type="text"
            {...register('serviceArea')}
            className={cn(
              'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy',
              'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal',
            )}
            placeholder="Ex: Montreal, Laval, Rive-Sud"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="contactEmail" className="text-sm font-medium text-navy">
            Email de contact
          </label>
          <input
            id="contactEmail"
            type="email"
            {...register('contactEmail')}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy',
              'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal',
              errors.contactEmail ? 'border-red-500' : 'border-border',
            )}
            placeholder="contact@example.com"
          />
          {errors.contactEmail && (
            <p className="text-xs text-red-500">{errors.contactEmail.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="contactPhone" className="text-sm font-medium text-navy">
            Telephone de contact
          </label>
          <input
            id="contactPhone"
            type="tel"
            {...register('contactPhone')}
            className={cn(
              'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy',
              'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal',
            )}
            placeholder="514-000-0000"
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'rounded-lg px-6 py-2 text-sm font-medium bg-teal text-white',
              'disabled:opacity-50',
            )}
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {isSuccess && !isPending && (
            <p className="text-sm text-teal font-medium">
              Profil mis a jour avec succes.
            </p>
          )}
          {isError && (
            <p className="text-sm text-red-500">
              Une erreur est survenue. Veuillez reessayer.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

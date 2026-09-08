"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vendorProfileService,
  isMissingProfileError,
  type VendorProfileInput,
} from "@/features/vendors/services/vendor-profile.service";
import { VENDOR_CATEGORY_OPTIONS } from "@/features/catalog/catalog-filters";
import type { VendorCategory } from "@/features/vendors/types";
import { retryOnTransientError } from "@/shared/lib/api";
import { getUserFacingError } from "@/shared/lib/user-facing-error";
import { FormErrorAlert } from "@/shared/ui/FormErrorAlert";
import { useAuth } from "@/shared/hooks/useAuth";
import { cn } from "@/shared/lib/utils";

const CATEGORY_VALUES = VENDOR_CATEGORY_OPTIONS.map((option) => option.value);

const profileSchema = z.object({
  businessName: z.string().min(1, "Le nom commercial est requis").max(200),
  // Aligné sur l'énumération `VendorCategory` du backend : une saisie libre
  // était systématiquement refusée en 400 par @IsEnum.
  category: z.enum(CATEGORY_VALUES as [VendorCategory, ...VendorCategory[]], {
    message: "Choisissez une catégorie",
  }),
  description: z.string().max(3000).optional(),
  serviceArea: z.string().max(200).optional(),
  contactEmail: z.string().email("Courriel invalide").optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const PROFILE_KEY = ["vendor-profile-mine"] as const;

const inputClass = (hasError: boolean) =>
  cn(
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy",
    "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal",
    hasError ? "border-red-500" : "border-border",
  );

export default function PrestataireProfilPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => vendorProfileService.getMyProfile(),
    // Un 404 est une réponse métier attendue (pas encore de profil) : le
    // rejouer ne ferait que retarder l'affichage du mode création.
    retry: retryOnTransientError,
  });

  // 404 métier ⇒ mode création. Toute autre erreur ⇒ état d'erreur explicite.
  const isCreating = isError && isMissingProfileError(error);
  const hasLoadFailure = isError && !isCreating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: "",
      category: "autre",
      description: "",
      serviceArea: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        businessName: profile.businessName ?? "",
        category: profile.category,
        description: profile.description ?? "",
        serviceArea: profile.serviceArea ?? "",
        contactEmail: profile.contactEmail ?? "",
        contactPhone: profile.contactPhone ?? "",
      });
      return;
    }

    // Mode création : on préremplit avec ce que l'onboarding a déjà collecté,
    // sans inventer de catégorie — l'onboarding stocke du texte libre, qui
    // n'est pas une valeur d'énumération valide.
    if (isCreating) {
      const onboarding = user?.onboardingData?.prestataire;
      reset({
        businessName: typeof onboarding?.displayName === "string" ? onboarding.displayName : "",
        category: "autre",
        description: typeof onboarding?.description === "string" ? onboarding.description : "",
        serviceArea: typeof onboarding?.serviceArea === "string" ? onboarding.serviceArea : "",
        contactEmail: user?.email ?? "",
        contactPhone: "",
      });
    }
  }, [profile, isCreating, user, reset]);

  const {
    mutate: save,
    isPending,
    isSuccess,
    isError: isSaveError,
    error: saveError,
  } = useMutation({
    mutationFn: (values: ProfileFormValues) => {
      const input: VendorProfileInput = {
        businessName: values.businessName,
        category: values.category,
        description: values.description || undefined,
        serviceArea: values.serviceArea || undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
      };
      return isCreating
        ? vendorProfileService.createProfile(input)
        : vendorProfileService.updateProfile(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted" role="status">
        Chargement du profil…
      </div>
    );
  }

  // Une panne ne doit JAMAIS se présenter comme un formulaire vide éditable :
  // l'utilisateur remplirait un formulaire qui ne peut pas aboutir.
  if (hasLoadFailure) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="font-serif text-2xl text-navy">Mon profil prestataire</h1>
        <div className="rounded-xl bg-destructive/8 p-4" role="alert">
          <p className="text-sm text-destructive">
            Impossible de charger votre profil pour le moment.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 min-h-11 text-sm font-medium text-teal underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="font-serif text-2xl text-navy">
          {isCreating ? "Créer mon profil prestataire" : "Mon profil prestataire"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isCreating
            ? "Votre profil n’existe pas encore. Complétez-le pour apparaître au catalogue et recevoir des demandes."
            : "Gérez votre fiche prestataire, vos services et vos informations publiques."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => save(values))}
        className="space-y-5 rounded-xl bg-surface p-6 shadow-card"
        data-testid="vendor-profile-form"
      >
        <div className="space-y-1">
          <label htmlFor="businessName" className="text-sm font-medium text-navy">
            Nom commercial <span className="text-red-500">*</span>
          </label>
          <input
            id="businessName"
            type="text"
            {...register("businessName")}
            className={inputClass(Boolean(errors.businessName))}
            aria-invalid={Boolean(errors.businessName)}
            placeholder="Ex : Productions Lumière"
          />
          {errors.businessName && (
            <p className="text-xs text-red-500">{errors.businessName.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="category" className="text-sm font-medium text-navy">
            Catégorie <span className="text-red-500">*</span>
          </label>
          {/* Select et non saisie libre : le backend valide contre une
              énumération fermée, un champ texte ne pouvait jamais aboutir. */}
          <select
            id="category"
            {...register("category")}
            className={inputClass(Boolean(errors.category))}
            aria-invalid={Boolean(errors.category)}
          >
            {VENDOR_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="serviceArea" className="text-sm font-medium text-navy">
            Zone de service
          </label>
          <input
            id="serviceArea"
            type="text"
            {...register("serviceArea")}
            className={inputClass(false)}
            placeholder="Ex : Grand Montréal"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium text-navy">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register("description")}
            className={cn(inputClass(false), "resize-none")}
            placeholder="Présentez vos services en quelques lignes."
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="contactEmail" className="text-sm font-medium text-navy">
            Courriel de contact
          </label>
          <input
            id="contactEmail"
            type="email"
            {...register("contactEmail")}
            className={inputClass(Boolean(errors.contactEmail))}
            aria-invalid={Boolean(errors.contactEmail)}
            placeholder="contact@example.com"
          />
          {errors.contactEmail && (
            <p className="text-xs text-red-500">{errors.contactEmail.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="contactPhone" className="text-sm font-medium text-navy">
            Téléphone de contact
          </label>
          <input
            id="contactPhone"
            type="tel"
            {...register("contactPhone")}
            className={inputClass(false)}
            placeholder="514-000-0000"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="min-h-11 rounded-lg bg-teal px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
            data-testid="vendor-profile-submit"
          >
            {isPending
              ? "Enregistrement…"
              : isCreating
                ? "Créer mon profil"
                : "Enregistrer"}
          </button>
          {/* Annoncé au lecteur d'écran : sans role/aria-live, un succès
              n'existe que visuellement. */}
          {isSuccess && !isPending && (
            <p className="text-sm font-medium text-teal" role="status" aria-live="polite">
              Profil enregistré avec succès.
            </p>
          )}
          {isSaveError && (
            <FormErrorAlert
              error={getUserFacingError(saveError, {
                fallback:
                  "Impossible d’enregistrer le profil. Vérifiez les champs, puis réessayez.",
              })}
            />
          )}
        </div>
      </form>
    </div>
  );
}

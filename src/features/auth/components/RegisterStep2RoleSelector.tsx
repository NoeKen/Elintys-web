"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Calendar, Loader2, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/shared/types";
import { RoleCard } from "./RoleCard";
import { StepIndicator } from "./StepIndicator";
import { cn } from "@/shared/lib/utils";

const step2Schema = z.object({
  firstName: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères"),
});

export interface RegisterStep2Data {
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface RegisterStep2Props {
  onSubmit: (data: RegisterStep2Data) => Promise<void>;
}

const roleCards: {
  value: UserRole;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
}[] = [
  {
    value: "organisateur",
    icon: Calendar,
    iconClassName: "bg-teal-pale text-teal",
    title: "Organisateur",
    description: "Créez, publiez et pilotez vos événements.",
  },
  {
    value: "prestataire",
    icon: Star,
    iconClassName: "bg-gold-pale text-gold-dark",
    title: "Prestataire",
    description: "Recevez des demandes qualifiées pour vos services.",
  },
  {
    value: "gestionnaire_salle",
    icon: Building2,
    iconClassName: "bg-terracotta-pale text-terracotta",
    title: "Gestionnaire de lieu",
    description: "Présentez vos espaces et gérez les réservations.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function RegisterStep2RoleSelector({ onSubmit }: RegisterStep2Props) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("organisateur");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
  });

  const submit = async (data: z.infer<typeof step2Schema>) => {
    await onSubmit({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: selectedRole,
    });
  };

  return (
    <div>
      <StepIndicator
        steps={[{ label: "Compte" }, { label: "Profil" }]}
        currentStep={2}
      />

      <motion.form
        variants={container}
        initial="hidden"
        animate="show"
        onSubmit={handleSubmit(submit)}
        noValidate
        className="space-y-6"
      >
        <motion.div variants={item}>
          <p className="section-eyebrow mb-4">Profil</p>
          <h1 className="font-serif text-[clamp(32px,5vw,44px)] text-navy-dark leading-tight mb-3">
            Votre profil Elintys
          </h1>
          <p className="text-sm leading-6 text-on-surface-variant">
            Choisissez votre rôle principal. Vous pourrez souscrire à d’autres rôles depuis votre profil.
          </p>
        </motion.div>

        <motion.div variants={item} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-bold">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
              className="premium-input"
              {...register("firstName")}
            />
            {errors.firstName && <p id="firstName-error" className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-bold">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              className="premium-input"
              {...register("lastName")}
            />
            {errors.lastName && <p id="lastName-error" className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </motion.div>

        <motion.div variants={container} className="space-y-3" role="radiogroup" aria-label="Rôle principal">
          {roleCards.map((card) => (
            <motion.div key={card.value} variants={item}>
              <RoleCard
                icon={card.icon}
                iconClassName={card.iconClassName}
                title={card.title}
                description={card.description}
                value={card.value}
                selected={selectedRole === card.value}
                onSelect={setSelectedRole}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={item}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "premium-button w-full min-h-12 rounded-full",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Création du compte...
              </>
            ) : (
              <>
                Créer mon compte
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </motion.div>

        <motion.p variants={item} className="text-center text-xs text-on-surface-variant">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/conditions" className="text-accent hover:underline">
            conditions d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="/confidentialite" className="text-accent hover:underline">
            politique de confidentialité
          </Link>
          .
        </motion.p>
      </motion.form>
    </div>
  );
}

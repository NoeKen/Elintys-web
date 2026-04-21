"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, AlertCircle } from "lucide-react";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { PasswordStrengthBar } from "@/shared/ui/PasswordStrengthBar";
import { StepIndicator } from "./StepIndicator";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const step1Schema = z
  .object({
    fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Adresse email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule requise")
      .regex(/[0-9]/, "Au moins un chiffre requis"),
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, "Vous devez accepter les conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type Step1Data = {
  fullName: string;
  email: string;
  password: string;
};

interface RegisterStep1FormProps {
  onSuccess: (data: Step1Data) => void;
  emailTakenError?: string | null;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

const baseField = cn(
  "w-full bg-transparent py-2 text-sm text-on-surface",
  "border-0 border-b border-outline-variant",
  "focus:outline-none focus:border-b-2 focus:border-accent",
  "placeholder:text-on-surface-variant transition-colors"
);

const errorField = cn(
  "w-full bg-transparent py-2 text-sm text-on-surface",
  "border-0 border-b border-destructive",
  "focus:outline-none focus:border-b-2 focus:border-destructive",
  "placeholder:text-on-surface-variant transition-colors"
);

export function RegisterStep1Form({ onSuccess, emailTakenError }: RegisterStep1FormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { acceptTerms: false },
  });

  const password = watch("password") ?? "";
  const confirmPassword = watch("confirmPassword") ?? "";
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (emailTakenError) {
      setError("email", { message: emailTakenError });
    }
  }, [emailTakenError, setError]);

  const onSubmit = (data: z.infer<typeof step1Schema>) => {
    onSuccess({ fullName: data.fullName, email: data.email, password: data.password });
  };

  return (
    <div>
      <StepIndicator
        steps={[{ label: "Informations" }, { label: "Préférences" }]}
        currentStep={1}
      />

      {/* Chip gratuit */}
      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent-light text-accent text-[10px] uppercase tracking-[0.08em] font-semibold">
          GRATUIT
        </span>
      </div>

      <h1 className="font-serif text-[32px] text-on-surface leading-tight mb-8">
        Créer votre compte
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* Nom complet */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-medium">
              NOM COMPLET
            </label>
            <input
              type="text"
              placeholder="Jean Dupont"
              autoComplete="name"
              className={errors.fullName ? errorField : baseField}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </motion.div>

          {/* Email */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-medium">
              ADRESSE E-MAIL
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="nom@exemple.com"
                autoComplete="email"
                className={cn(
                  errors.email ? errorField : baseField,
                  errors.email && "pr-8"
                )}
                {...register("email")}
              />
              {errors.email && (
                <AlertCircle
                  size={16}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-destructive"
                />
              )}
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Mot de passe */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-medium">
              MOT DE PASSE
            </label>
            <PasswordInput
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordStrengthBar password={password} />
          </motion.div>

          {/* Confirmer mot de passe */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-medium">
              CONFIRMER LE MOT DE PASSE
            </label>
            <PasswordInput
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              showCheckIcon={passwordsMatch}
              {...register("confirmPassword")}
            />
          </motion.div>

          {/* Checkbox conditions */}
          <motion.div variants={item} className="flex items-start gap-3">
            <Checkbox.Root
              id="acceptTerms"
              className={cn(
                "w-4 h-4 shrink-0 mt-0.5 rounded border border-outline-variant bg-surface",
                "data-[state=checked]:bg-accent data-[state=checked]:border-accent",
                "focus:outline-none focus:ring-2 focus:ring-accent/30 transition-colors"
              )}
              onCheckedChange={(checked) => {
                const event = {
                  target: {
                    name: "acceptTerms",
                    value: checked === true,
                  },
                };
                register("acceptTerms").onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
              }}
            >
              <Checkbox.Indicator className="flex items-center justify-center">
                <Check size={10} strokeWidth={3} className="text-white" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <label htmlFor="acceptTerms" className="text-sm text-on-surface-variant cursor-pointer leading-relaxed">
              J&apos;accepte les{" "}
              <a href="#" className="font-bold text-on-surface hover:underline">
                conditions d&apos;utilisation
              </a>{" "}
              et la{" "}
              <a href="#" className="font-bold text-on-surface hover:underline">
                politique de confidentialité
              </a>
              .
            </label>
          </motion.div>
          {errors.acceptTerms && (
            <p className="text-xs text-destructive -mt-4">{errors.acceptTerms.message}</p>
          )}

          {/* Bouton continuer */}
          <motion.div variants={item}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full h-12 rounded-md bg-accent text-white text-sm font-semibold",
                "flex items-center justify-center transition-opacity",
                "hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              Continuer →
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={item} className="text-center text-sm text-on-surface-variant">
            Vous avez déjà un compte ?{" "}
            <Link href={ROUTES.AUTH.LOGIN} className="text-accent hover:underline font-medium">
              Se connecter
            </Link>
          </motion.p>
        </motion.div>
      </form>
    </div>
  );
}

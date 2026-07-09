"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import * as Checkbox from "@radix-ui/react-checkbox";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { PasswordStrengthBar } from "@/shared/ui/PasswordStrengthBar";
import { StepIndicator } from "./StepIndicator";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const step1Schema = z
  .object({
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
  email: string;
  password: string;
};

interface RegisterStep1FormProps {
  onSuccess: (data: Step1Data) => void;
  emailTakenError?: string | null;
  initialEmail?: string;
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
  "premium-input text-sm",
  "placeholder:text-on-surface-variant"
);

const errorField = cn(
  "premium-input text-sm",
  "border-destructive placeholder:text-on-surface-variant"
);

export function RegisterStep1Form({ onSuccess, emailTakenError, initialEmail = "" }: RegisterStep1FormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { acceptTerms: false, email: initialEmail },
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
    onSuccess({ email: data.email, password: data.password });
  };

  return (
    <div>
      <StepIndicator
        steps={[{ label: "Informations" }, { label: "Préférences" }]}
        currentStep={1}
      />

      {/* Chip gratuit */}
      <div className="mb-4">
        <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent-light px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-accent">
          GRATUIT
        </span>
      </div>

      <h1 className="mb-8 font-serif text-[clamp(32px,5vw,44px)] leading-tight text-navy-dark">
        Créer votre compte
      </h1>

      {emailTakenError && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-white/80 px-4 py-3 text-sm text-destructive shadow-card">
          <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p>{emailTakenError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* Email */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <label htmlFor="register-email" className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-bold">
              ADRESSE E-MAIL
            </label>
            <div className="relative">
              <input
                id="register-email"
                type="email"
                placeholder="nom@exemple.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "register-email-error" : undefined}
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
              <p id="register-email-error" className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Mot de passe */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <label htmlFor="register-password" className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-bold">
              MOT DE PASSE
            </label>
            <PasswordInput
              id="register-password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordStrengthBar password={password} />
          </motion.div>

          {/* Confirmer mot de passe */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <label htmlFor="register-confirm-password" className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-bold">
              CONFIRMER LE MOT DE PASSE
            </label>
            <PasswordInput
              id="register-confirm-password"
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
                "w-5 h-5 shrink-0 mt-0.5 rounded-md border border-outline-variant bg-white/75",
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
              <Link href="/conditions" className="font-bold text-on-surface hover:underline">
                conditions d&apos;utilisation
              </Link>{" "}
              et la{" "}
              <Link href="/confidentialite" className="font-bold text-on-surface hover:underline">
                politique de confidentialité
              </Link>
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
                "premium-button w-full min-h-12",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              Continuer
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={item} className="text-center text-sm text-on-surface-variant">
            Vous avez déjà un compte ?{" "}
            <Link href={ROUTES.AUTH.LOGIN} className="text-accent hover:underline font-semibold">
              Se connecter
            </Link>
          </motion.p>
        </motion.div>
      </form>
    </div>
  );
}

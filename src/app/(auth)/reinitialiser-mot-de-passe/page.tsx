"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, AlertTriangle, BadgeCheck, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { PasswordStrengthBar } from "@/shared/ui/PasswordStrengthBar";
import { authService } from "@/features/auth/client/auth.service";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function ReinitialiserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<"idle" | "success" | "invalid-token">(
    token ? "idle" : "invalid-token"
  );

  useEffect(() => {
    if (!token) {
      router.replace(ROUTES.AUTH.FORGOT_PASSWORD);
    }
  }, [token, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch("password") ?? "";
  const confirmPassword = watch("confirmPassword") ?? "";
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const checks = [
    { label: "8 caractères minimum", met: password.length >= 8 },
    { label: "Au moins une majuscule", met: /[A-Z]/.test(password) },
    { label: "Au moins un chiffre", met: /[0-9]/.test(password) },
  ];

  const allChecksMet = checks.every((c) => c.met) && passwordsMatch;

  const onSubmit = async (data: FormData) => {
    try {
      await authService.resetPassword(token!, data.password);
      setPageState("success");
    } catch (err: unknown) {
      const authErr = err as { code?: string };
      if (authErr?.code === "TOKEN_EXPIRED") {
        setPageState("invalid-token");
      }
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <AnimatePresence mode="wait">
          {pageState === "idle" && (
            <motion.div
              key="idle"
              variants={fade}
              initial="hidden"
              animate="show"
              exit="exit"
              className="bg-surface rounded-2xl p-10"
              style={{ boxShadow: "0px 12px 32px rgba(13, 30, 53, 0.06)" }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-xl bg-surface-low flex items-center justify-center">
                  <Lock size={28} className="text-on-surface" />
                </div>
              </div>

              <h1 className="font-serif text-[28px] text-on-surface text-center mb-2">
                Nouveau mot de passe
              </h1>
              <p className="text-sm text-on-surface-variant text-center mb-8">
                Veuillez définir un mot de passe sécurisé pour votre compte Elintys.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                {/* Nouveau mot de passe */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-medium">
                    NOUVEAU MOT DE PASSE
                  </label>
                  <PasswordInput
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <PasswordStrengthBar password={password} />

                  {/* Checklist */}
                  <div className="mt-2 space-y-1.5">
                    {checks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2">
                        {check.met ? (
                          <CheckCircle2 size={16} className="text-accent shrink-0" />
                        ) : (
                          <Circle size={16} className="text-outline-variant shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-[13px]",
                            check.met ? "text-on-surface" : "text-on-surface-variant"
                          )}
                        >
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirmer */}
                <div className="flex flex-col gap-1.5">
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
                </div>

                <button
                  type="submit"
                  disabled={!allChecksMet || isSubmitting}
                  className={cn(
                    "w-full h-12 rounded-md bg-accent text-white text-sm font-semibold",
                    "flex items-center justify-center gap-2 transition-opacity",
                    "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    "Réinitialiser"
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {pageState === "invalid-token" && (
            <motion.div
              key="invalid"
              variants={fade}
              initial="hidden"
              animate="show"
              exit="exit"
              className="bg-surface rounded-2xl p-10 text-center"
              style={{ boxShadow: "0px 12px 32px rgba(13, 30, 53, 0.06)" }}
            >
              <div className="inline-flex w-14 h-14 rounded-xl bg-[#FEF3C7] items-center justify-center mb-6">
                <AlertTriangle size={28} className="text-amber" />
              </div>
              <h1 className="font-serif text-[28px] text-on-surface mb-3">
                Lien invalide ou expiré
              </h1>
              <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                Ce lien de réinitialisation n&apos;est plus valide. Veuillez en faire une nouvelle
                demande.
              </p>
              <Link
                href={ROUTES.AUTH.FORGOT_PASSWORD}
                className={cn(
                  "inline-flex items-center justify-center w-full h-12 rounded-md",
                  "bg-accent text-white text-sm font-semibold",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                Demander un nouveau lien
              </Link>
            </motion.div>
          )}

          {pageState === "success" && (
            <motion.div
              key="success"
              variants={fade}
              initial="hidden"
              animate="show"
              exit="exit"
              className="bg-surface rounded-2xl p-10 text-center"
              style={{ boxShadow: "0px 12px 32px rgba(13, 30, 53, 0.06)" }}
            >
              <div className="inline-flex w-16 h-16 rounded-xl bg-accent-light items-center justify-center mb-6">
                <BadgeCheck size={32} className="text-accent" />
              </div>
              <h1 className="font-serif text-[28px] text-on-surface mb-3">
                Mot de passe réinitialisé !
              </h1>
              <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                Votre compte a été sécurisé avec succès. Vous pouvez maintenant vous connecter avec
                vos nouveaux identifiants.
              </p>
              <Link
                href={ROUTES.AUTH.LOGIN}
                className={cn(
                  "inline-flex items-center justify-center w-full h-12 rounded-md",
                  "border-[1.5px] border-accent text-accent text-sm font-semibold",
                  "hover:bg-accent-light transition-colors mb-6"
                )}
              >
                Se connecter
              </Link>
              <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant">
                ELINTYS SECURITY CONTROL
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="font-serif text-lg text-accent">Elintys</span>
          {["À propos", "Confidentialité", "Conditions", "Support", "Blog"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant">© 2024 Elintys. Tous droits réservés.</p>
      </div>
    </div>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense>
      <ReinitialiserContent />
    </Suspense>
  );
}

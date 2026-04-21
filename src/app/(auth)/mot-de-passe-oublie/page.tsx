"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { LockOpen, Mail, Loader2 } from "lucide-react";
import { authService } from "@/features/auth/client/auth.service";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const schema = z.object({
  email: z.string().email("Adresse email invalide"),
});
type FormData = z.infer<typeof schema>;

const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const fieldClass = cn(
  "w-full bg-transparent py-2 text-sm text-on-surface",
  "border-0 border-b border-outline-variant",
  "focus:outline-none focus:border-b-2 focus:border-accent",
  "placeholder:text-on-surface-variant transition-colors"
);

export default function MotDePasseOubliePage() {
  const [state, setState] = useState<"idle" | "submitted">("idle");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmittedEmail(data.email);
    await authService.forgotPassword(data.email);
    setState("submitted");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <AnimatePresence mode="wait">
          {state === "idle" ? (
            <motion.div
              key="idle"
              variants={fade}
              initial="hidden"
              animate="show"
              exit="exit"
              className="bg-surface rounded-2xl p-10 text-center"
              style={{ boxShadow: "0px 12px 32px rgba(13, 30, 53, 0.06)" }}
            >
              {/* Icône cadenas */}
              <div className="inline-flex w-14 h-14 rounded-xl bg-surface-low items-center justify-center mb-6">
                <LockOpen size={28} className="text-on-surface" />
              </div>

              <h1 className="font-serif text-[28px] text-on-surface mb-3">
                Mot de passe oublié ?
              </h1>
              <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                Pas d&apos;inquiétude. Entrez votre adresse e-mail ci-dessous et nous vous
                enverrons un lien pour réinitialiser votre accès.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="text-left space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-medium">
                    ADRESSE EMAIL
                  </label>
                  <input
                    type="email"
                    placeholder="exemple@elintys.ca"
                    autoComplete="email"
                    className={errors.email ? cn(fieldClass, "border-destructive") : fieldClass}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full h-12 rounded-md bg-accent text-white text-sm font-semibold",
                    "flex items-center justify-center gap-2 transition-opacity",
                    "hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien"
                  )}
                </button>
              </form>

              <div className="mt-6">
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  ← Retour à la connexion
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="submitted"
              variants={fade}
              initial="hidden"
              animate="show"
              exit="exit"
              className="bg-surface rounded-2xl p-10 text-center"
              style={{ boxShadow: "0px 12px 32px rgba(13, 30, 53, 0.06)" }}
            >
              {/* Icône enveloppe */}
              <div className="inline-flex w-14 h-14 rounded-xl bg-accent-light items-center justify-center mb-6">
                <Mail size={28} className="text-accent" />
              </div>

              <h1 className="font-serif text-[28px] text-on-surface mb-3">Lien envoyé !</h1>
              <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                Nous avons envoyé les instructions de réinitialisation à l&apos;adresse{" "}
                <strong className="text-on-surface">{submittedEmail}</strong>.
              </p>

              <Link
                href={ROUTES.AUTH.LOGIN}
                className={cn(
                  "inline-flex items-center justify-center w-full h-12 rounded-md",
                  "border-[1.5px] border-accent text-accent text-sm font-semibold",
                  "hover:bg-accent-light transition-colors mb-4"
                )}
              >
                Retour à la connexion
              </Link>

              <p className="text-sm text-on-surface-variant mb-2">
                Vous n&apos;avez pas reçu l&apos;email ?{" "}
                <button
                  type="button"
                  onClick={() => setState("idle")}
                  className="text-accent hover:underline font-medium"
                >
                  Renvoyer le lien
                </button>
              </p>
              <p className="text-sm text-on-surface-variant">
                Besoin d&apos;aide ? Contactez notre{" "}
                <a href="#" className="text-accent hover:underline">
                  support technique
                </a>
                .
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-4">
          <span className="font-serif text-lg text-accent">Elintys</span>
          <span className="text-outline-variant">·</span>
          <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface">Support</a>
          <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface">Confidentialité</a>
          <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface">Conditions</a>
        </div>
        <p className="text-xs text-on-surface-variant">© 2024 Elintys. Tous droits réservés.</p>
      </div>
    </div>
  );
}

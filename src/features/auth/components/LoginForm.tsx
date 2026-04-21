"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { authService } from "../client/auth.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Ce champ est requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

const fieldClass = cn(
  "w-full bg-transparent py-2 text-sm text-on-surface",
  "border-0 border-b border-outline-variant",
  "focus:outline-none focus:border-b-2 focus:border-accent",
  "placeholder:text-on-surface-variant transition-colors"
);

const fieldErrorClass = cn(
  "w-full bg-transparent py-2 text-sm text-on-surface",
  "border-0 border-b border-destructive",
  "focus:outline-none focus:border-b-2 focus:border-destructive",
  "placeholder:text-on-surface-variant transition-colors"
);

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    try {
      const session = await authService.login(data);
      login(session);
      router.push(ROUTES.DASHBOARD.HOME);
    } catch (err: unknown) {
      const authErr = err as { code?: string };
      if (authErr?.code === "INVALID_CREDENTIALS") {
        setGlobalError("Email ou mot de passe incorrect.");
      } else {
        setGlobalError("Une erreur est survenue. Veuillez réessayer.");
      }
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Titre */}
      <motion.div variants={item} className="mb-8">
        <h1 className="font-serif text-[36px] text-on-surface leading-tight mb-2">
          Bon retour 👋
        </h1>
        <p className="text-sm text-on-surface-variant">
          Veuillez entrer vos identifiants pour accéder à votre tableau de bord.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* Email */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <label className="text-sm text-on-surface-variant">Adresse e-mail</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="nom@exemple.com"
              className={errors.email ? fieldErrorClass : fieldClass}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Mot de passe */}
          <motion.div variants={item} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-on-surface-variant">Mot de passe</label>
              <Link
                href={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-sm text-accent hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <PasswordInput
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
          </motion.div>

          {/* Erreur globale */}
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-md bg-destructive/8 border border-destructive/20 px-3 py-2.5"
            >
              <AlertCircle size={15} className="text-destructive shrink-0" />
              <p className="text-sm text-destructive">{globalError}</p>
            </motion.div>
          )}

          {/* Bouton connexion */}
          <motion.div variants={item}>
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
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </motion.div>

          {/* Séparateur */}
          <motion.div variants={item} className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-xs text-on-surface-variant px-3">ou</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </motion.div>

          {/* Bouton Google (désactivé) */}
          <motion.div variants={item} className="relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-on-surface text-white text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 rounded">
                BIENTÔT DISPONIBLE
              </span>
            </div>
            <button
              type="button"
              disabled
              className={cn(
                "w-full h-12 rounded-md bg-surface-low border border-outline-variant",
                "flex items-center justify-center gap-3 text-sm text-on-surface-variant",
                "opacity-70 cursor-not-allowed"
              )}
            >
              <GoogleIcon />
              Continuer avec Google
            </button>
          </motion.div>

          {/* Footer form */}
          <motion.p variants={item} className="text-center text-sm text-on-surface-variant">
            Vous n&apos;avez pas de compte ?{" "}
            <Link href={ROUTES.AUTH.REGISTER} className="text-accent hover:underline font-medium">
              S&apos;inscrire
            </Link>
          </motion.p>
        </motion.div>
      </form>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="currentColor"
        opacity=".6"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="currentColor"
        opacity=".5"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
        fill="currentColor"
        opacity=".55"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
        fill="currentColor"
        opacity=".5"
      />
    </svg>
  );
}

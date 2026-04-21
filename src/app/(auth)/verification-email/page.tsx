"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Check, CheckCircle2 } from "lucide-react";
import { authService } from "@/features/auth/client/auth.service";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

function VerificationEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await authService.verifyEmailCheck(email);
      window.location.href = ROUTES.DASHBOARD.HOME;
    } catch {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await authService.resendVerification(email);
    setResendSuccess(true);
    startCountdown();
    setTimeout(() => setResendSuccess(false), 6000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo */}
      <div className="flex justify-center pt-10">
        <span className="font-serif text-[28px] text-accent">Elintys</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-[480px] bg-surface rounded-2xl p-12 text-center"
          style={{ boxShadow: "0px 12px 32px rgba(13, 30, 53, 0.06)" }}
        >
          {/* Icône enveloppe + badge check */}
          <div className="relative inline-flex mb-6">
            <div className="w-16 h-16 rounded-xl bg-surface-low flex items-center justify-center">
              <Mail size={32} className="text-on-surface" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <Check size={10} strokeWidth={3} className="text-white" />
            </div>
          </div>

          <h1 className="font-serif text-[28px] text-on-surface mb-3">
            Vérifiez votre boîte mail
          </h1>

          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
            Un lien de confirmation a été envoyé à l&apos;adresse{" "}
            <strong className="text-on-surface">{email || "votre adresse e-mail"}</strong>. Veuillez
            cliquer sur le lien pour activer votre compte.
          </p>

          {/* Bandeau succès renvoi */}
          <AnimatePresence>
            {resendSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 bg-accent-light rounded-lg px-4 py-3 mb-6 text-left"
              >
                <CheckCircle2 size={16} className="text-accent shrink-0" />
                <p className="text-sm text-accent">Lien de vérification renvoyé avec succès.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton vérifier */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className={cn(
              "w-full h-12 rounded-md bg-accent text-white text-sm font-semibold mb-6",
              "flex items-center justify-center gap-2 transition-opacity",
              "hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isVerifying ? "Vérification..." : "J'ai vérifié mon email"}
          </button>

          {/* Renvoyer le lien */}
          <p className="text-sm text-on-surface-variant mb-6">
            Vous n&apos;avez rien reçu ?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className={cn(
                "text-accent font-medium transition-opacity",
                countdown > 0 ? "opacity-40 cursor-not-allowed" : "hover:underline"
              )}
            >
              Renvoyer le lien
            </button>
            {countdown > 0 && (
              <span className="text-on-surface-variant ml-1">{countdown}s</span>
            )}
          </p>

          <Link
            href={ROUTES.AUTH.LOGIN}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← Retour à la connexion
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-on-surface-variant">© 2024 Elintys. Tous droits réservés.</p>
      </div>
    </div>
  );
}

export default function VerificationEmailPage() {
  return (
    <Suspense>
      <VerificationEmailContent />
    </Suspense>
  );
}

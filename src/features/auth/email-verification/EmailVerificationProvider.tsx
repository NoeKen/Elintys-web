'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { authService } from '@/features/auth/client/auth.service';
import { useAuth } from '@/shared/hooks/useAuth';
import { ApiClientError } from '@/shared/lib/api';
import { onEmailNotVerified } from '@/shared/lib/email-verification-signal';
import { EmailVerificationDialog } from './EmailVerificationDialog';
import {
  EmailVerificationContext,
  RESEND_COOLDOWN_SECONDS,
  type EmailVerificationContextValue,
  type RefreshStatus,
  type ResendStatus,
} from './email-verification-context';

interface EmailVerificationProviderProps {
  children: React.ReactNode;
}

/**
 * État partagé de la vérification de courriel : renvoi du lien avec délai
 * minimal, relecture de la session, et dialogue ouvert automatiquement dès que
 * le client API reçoit un refus `EMAIL_NOT_VERIFIED`.
 *
 * Monté une seule fois (dans `Providers`) : aucune page n'a à gérer ce refus.
 */
export function EmailVerificationProvider({ children }: EmailVerificationProviderProps) {
  const { user, session, login } = useAuth();
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle');
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Référence stable vers la session courante pour l'abonné au signal, qui
  // n'est enregistré qu'une fois.
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(
    () =>
      onEmailNotVerified(() => {
        const current = sessionRef.current;
        if (!current) return;
        // Le serveur fait autorité : une session locale qui se croyait vérifiée
        // est corrigée pour que le bandeau apparaisse aussi.
        if (current.user.isEmailVerified) {
          login({ ...current, user: { ...current.user, isEmailVerified: false } });
        }
        setDialogOpen(true);
      }),
    [login],
  );

  useEffect(() => {
    if (cooldownUntil === null) return;
    const id = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (tick >= cooldownUntil) setCooldownUntil(null);
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const cooldown =
    cooldownUntil === null ? 0 : Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const startCooldown = useCallback(() => {
    const start = Date.now();
    setNow(start);
    setCooldownUntil(start + RESEND_COOLDOWN_SECONDS * 1000);
  }, []);

  const resend = useCallback(async () => {
    if (cooldown > 0 || resendStatus === 'pending') return;
    setResendStatus('pending');
    try {
      await authService.resendMyVerification();
      setResendStatus('success');
      startCooldown();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 429) {
        // Le serveur a déjà refusé : on respecte son rythme plutôt que de
        // laisser l'utilisateur marteler le bouton.
        setResendStatus('rate-limited');
        startCooldown();
        return;
      }
      setResendStatus('error');
    }
  }, [cooldown, resendStatus, startCooldown]);

  const refresh = useCallback(async () => {
    setRefreshStatus('pending');
    const restored = await authService.restoreSession();
    if (restored.status !== 'authenticated') {
      setRefreshStatus('idle');
      return;
    }
    login(restored.session);
    if (restored.session.user.isEmailVerified) {
      setRefreshStatus('idle');
      setDialogOpen(false);
      return;
    }
    setRefreshStatus('still-unverified');
  }, [login]);

  const value = useMemo<EmailVerificationContextValue>(
    () => ({
      resendStatus,
      cooldown,
      resend,
      refreshStatus,
      refresh,
      dialogOpen,
      setDialogOpen,
    }),
    [resendStatus, cooldown, resend, refreshStatus, refresh, dialogOpen],
  );

  return (
    <EmailVerificationContext.Provider value={value}>
      {children}
      {user && !user.isEmailVerified ? <EmailVerificationDialog /> : null}
    </EmailVerificationContext.Provider>
  );
}

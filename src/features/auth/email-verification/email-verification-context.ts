'use client';

import { createContext, useContext } from 'react';

/** Délai client entre deux renvois (le serveur applique aussi son throttle). */
export const RESEND_COOLDOWN_SECONDS = 60;

export type ResendStatus = 'idle' | 'pending' | 'success' | 'error' | 'rate-limited';
export type RefreshStatus = 'idle' | 'pending' | 'still-unverified';

export interface EmailVerificationContextValue {
  resendStatus: ResendStatus;
  /** Secondes restantes avant de pouvoir renvoyer ; 0 = disponible. */
  cooldown: number;
  resend: () => Promise<void>;
  refreshStatus: RefreshStatus;
  /** Relit `/auth/me` : l'utilisateur a peut-être confirmé dans un autre onglet. */
  refresh: () => Promise<void>;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export const EmailVerificationContext = createContext<EmailVerificationContextValue | null>(null);

export function useEmailVerification(): EmailVerificationContextValue {
  const context = useContext(EmailVerificationContext);
  if (!context) {
    throw new Error('useEmailVerification doit être utilisé dans EmailVerificationProvider');
  }
  return context;
}

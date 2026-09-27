'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/utils';
import messages from '../../../../messages/fr.json';
import { useEmailVerification } from './email-verification-context';

const copy = messages.emailVerification;

interface EmailVerificationActionsProps {
  /** Préfixe des `data-testid`, pour distinguer bandeau et dialogue. */
  testIdPrefix: string;
  showLogout?: boolean;
  className?: string;
}

/**
 * Actions communes au bandeau et au dialogue : renvoi du lien (avec délai
 * visible), relecture de la session et déconnexion.
 */
export function EmailVerificationActions({
  testIdPrefix,
  showLogout = true,
  className,
}: EmailVerificationActionsProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { resendStatus, cooldown, resend, refreshStatus, refresh } = useEmailVerification();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isResending = resendStatus === 'pending';
  const resendLabel = isResending
    ? copy.resending
    : cooldown > 0
      ? copy.cooldown.replace('{seconds}', String(cooldown))
      : copy.resend;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/connexion');
      router.refresh();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="min-h-11 px-4"
          icon={<MailCheck size={16} aria-hidden="true" />}
          // Pas de `loading` : il remplace le libellé par un spinner et le
          // bouton perdrait son nom accessible pendant l'envoi.
          disabled={cooldown > 0 || isResending}
          onClick={() => void resend()}
          data-testid={`${testIdPrefix}-resend`}
        >
          {resendLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="min-h-11 px-4"
          icon={<RefreshCw size={16} aria-hidden="true" />}
          disabled={refreshStatus === 'pending'}
          onClick={() => void refresh()}
          data-testid={`${testIdPrefix}-refresh`}
        >
          {refreshStatus === 'pending' ? copy.refreshing : copy.refresh}
        </Button>
        {showLogout ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-11 px-4"
            icon={<LogOut size={16} aria-hidden="true" />}
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            data-testid={`${testIdPrefix}-logout`}
          >
            {isLoggingOut ? copy.loggingOut : copy.logout}
          </Button>
        ) : null}
      </div>

      {/* Région live permanente : les messages y sont annoncés sans voler le focus. */}
      <div aria-live="polite" className="text-sm leading-6">
        {resendStatus === 'success' ? (
          <p role="status" className="text-sage-dark" data-testid={`${testIdPrefix}-success`}>
            {copy.resendSuccess}
          </p>
        ) : null}
        {refreshStatus === 'still-unverified' ? (
          <p role="status" className="text-on-surface-variant">
            {copy.stillUnverified}
          </p>
        ) : null}
      </div>
      {resendStatus === 'error' || resendStatus === 'rate-limited' ? (
        <p role="alert" className="text-sm leading-6 text-destructive" data-testid={`${testIdPrefix}-error`}>
          {resendStatus === 'rate-limited' ? copy.resendRateLimited : copy.resendError}
        </p>
      ) : null}
    </div>
  );
}

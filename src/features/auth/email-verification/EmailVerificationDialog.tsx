'use client';

import { useAuth } from '@/shared/hooks/useAuth';
import { Modal } from '@/shared/ui/Modal';
import messages from '../../../../messages/fr.json';
import { EmailVerificationActions } from './EmailVerificationActions';
import { useEmailVerification } from './email-verification-context';

const copy = messages.emailVerification;

/**
 * Ouvert automatiquement quand l'API refuse une action avec
 * `EMAIL_NOT_VERIFIED` : l'échec n'est jamais silencieux et le renvoi du lien
 * est à portée de main, quelle que soit la page.
 */
export function EmailVerificationDialog() {
  const { user } = useAuth();
  const { dialogOpen, setDialogOpen } = useEmailVerification();

  return (
    <Modal
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      title={copy.dialogTitle}
      description={copy.dialogDescription}
      className="max-w-[calc(100vw-2rem)] sm:max-w-lg"
    >
      <div data-testid="email-verification-dialog">
        {user ? (
          <p className="mb-4 break-words text-sm text-on-surface">
            <strong>{user.email}</strong>
          </p>
        ) : null}
        <EmailVerificationActions testIdPrefix="email-verification-dialog" showLogout={false} />
      </div>
    </Modal>
  );
}

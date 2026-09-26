'use client';

import { MailWarning } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import messages from '../../../../messages/fr.json';
import { EmailVerificationActions } from './EmailVerificationActions';

const copy = messages.emailVerification;

/**
 * Bandeau persistant de l'espace connecté pour un courriel non vérifié.
 *
 * Le compte reste en lecture seule côté API tant que l'adresse n'est pas
 * confirmée : le bandeau l'annonce sans bloquer la consultation.
 */
export function EmailVerificationBanner() {
  const { user } = useAuth();
  if (!user || user.isEmailVerified) return null;

  const [before, after = ''] = copy.bannerDescription.split('{email}');

  return (
    <section
      aria-labelledby="email-verification-banner-title"
      data-testid="email-verification-banner"
      className="mx-3 mt-3 rounded-[20px] bg-terracotta-pale px-4 py-4 shadow-card md:px-5"
    >
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 shrink-0 text-terracotta-dark" size={20} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="email-verification-banner-title" className="text-sm font-semibold text-navy-dark">
            {copy.bannerTitle}
          </h2>
          <p className="mt-1 break-words text-sm leading-6 text-on-surface-variant">
            {before}
            <strong className="text-on-surface" data-testid="email-verification-banner-email">
              {user.email}
            </strong>
            {after}
          </p>
          <EmailVerificationActions testIdPrefix="email-verification-banner" className="mt-3" />
        </div>
      </div>
    </section>
  );
}

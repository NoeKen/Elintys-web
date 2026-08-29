'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import {
  RegisterStep2RoleSelector,
  type RegisterStep2Data,
} from '@/features/auth/components/RegisterStep2RoleSelector';
import { authService } from '@/features/auth/client/auth.service';
import { useAuth } from '@/shared/hooks/useAuth';
import { clearRegistrationDraft, readRegistrationDraft } from '@/lib/auth/registration-draft';
import { getFirstOnboardingPath } from '@/lib/auth/redirects';
import { getUserFacingError, type UserFacingError } from '@/shared/lib/user-facing-error';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';

interface RegisterStep2ClientProps {
  redirectTo?: string;
}

export function RegisterStep2Client({ redirectTo }: RegisterStep2ClientProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [draftReady, setDraftReady] = useState(false);
  const [globalError, setGlobalError] = useState<UserFacingError | null>(null);

  useEffect(() => {
    const draft = readRegistrationDraft();
    if (!draft) {
      const params = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
      router.replace(`/inscription/etape-1${params}`);
      return;
    }
    const readyTimer = window.setTimeout(() => setDraftReady(true), 0);
    return () => window.clearTimeout(readyTimer);
  }, [redirectTo, router]);

  const handleRegister = async (profile: RegisterStep2Data) => {
    const draft = readRegistrationDraft();
    if (!draft) {
      const params = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
      router.replace(`/inscription/etape-1${params}`);
      return;
    }

    setGlobalError(null);
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();

    try {
      const session = await authService.register({
        ...draft,
        fullName,
        roles: [profile.role],
      });
      clearRegistrationDraft();
      login(session);

      const nextPath = redirectTo ?? getFirstOnboardingPath([profile.role]);
      router.push(`/verification-email?email=${encodeURIComponent(draft.email)}&next=${encodeURIComponent(nextPath)}`);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      if (authErr?.code === 'EMAIL_TAKEN') {
        clearRegistrationDraft();
        const params = new URLSearchParams({
          error: 'email-taken',
          email: draft.email,
        });
        if (redirectTo) params.set('redirect', redirectTo);
        router.push(`/inscription/etape-1?${params.toString()}`);
        return;
      }
      setGlobalError(
        getUserFacingError(err, {
          fallback: 'Impossible de créer le compte pour le moment. Vérifiez vos informations, puis réessayez.',
        }),
      );
    }
  };

  return (
    <AuthSplitLayout
      headline="Créez des moments d'exception."
      subheadline="Un profil clair, des accès adaptés, une suite fluide."
      progressStep={2}
      progressTotal={2}
      backHref={redirectTo ? `/inscription/etape-1?redirect=${encodeURIComponent(redirectTo)}` : '/inscription/etape-1'}
      backLabel="Retour à l'étape 1"
    >
      {globalError && <FormErrorAlert error={globalError} className="mb-5 bg-white/75 shadow-card" />}
      {draftReady && <RegisterStep2RoleSelector onSubmit={handleRegister} />}
    </AuthSplitLayout>
  );
}

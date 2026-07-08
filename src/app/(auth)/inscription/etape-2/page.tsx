"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import {
  RegisterStep2RoleSelector,
  type RegisterStep2Data,
} from "@/features/auth/components/RegisterStep2RoleSelector";
import { authService } from "@/features/auth/client/auth.service";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  clearRegistrationDraft,
  readRegistrationDraft,
} from "@/lib/auth/registration-draft";
import { getFirstOnboardingPath } from "@/lib/auth/redirects";

export default function InscriptionEtape2Page() {
  const router = useRouter();
  const { login } = useAuth();
  const [draftReady, setDraftReady] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const draft = readRegistrationDraft();
    if (!draft) {
      router.replace("/inscription/etape-1");
      return;
    }
    setDraftReady(true);
  }, [router]);

  const handleRegister = async (profile: RegisterStep2Data) => {
    const draft = readRegistrationDraft();
    if (!draft) {
      router.replace("/inscription/etape-1");
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

      const nextPath = getFirstOnboardingPath([profile.role]);
      router.push(`/verification-email?email=${encodeURIComponent(draft.email)}&next=${encodeURIComponent(nextPath)}`);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      if (authErr?.code === "EMAIL_TAKEN") {
        clearRegistrationDraft();
        const params = new URLSearchParams({
          error: "email-taken",
          email: draft.email,
        });
        router.push(`/inscription/etape-1?${params.toString()}`);
        return;
      }
      setGlobalError(authErr.message ?? "Impossible de créer le compte pour le moment. Veuillez réessayer.");
    }
  };

  return (
    <AuthSplitLayout
      headline="Créez des moments d'exception."
      subheadline="Un profil clair, des accès adaptés, une suite fluide."
      progressStep={2}
      progressTotal={2}
      backHref="/inscription/etape-1"
      backLabel="Retour à l'étape 1"
    >
      {globalError && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-white/75 px-4 py-3 text-sm text-destructive shadow-card">
          <AlertCircle size={16} aria-hidden="true" />
          {globalError}
        </div>
      )}
      {draftReady && <RegisterStep2RoleSelector onSubmit={handleRegister} />}
    </AuthSplitLayout>
  );
}

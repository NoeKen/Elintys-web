"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { RegisterStep1Form, type Step1Data } from "@/features/auth/components/RegisterStep1Form";
import { saveRegistrationDraft } from "@/lib/auth/registration-draft";

const EMAIL_TAKEN_MESSAGE =
  "Un compte existe déjà avec cette adresse courriel. Connectez-vous ou utilisez une autre adresse.";

function InscriptionEtape1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailTakenError = searchParams.get("error") === "email-taken" ? EMAIL_TAKEN_MESSAGE : null;
  const initialEmail = searchParams.get("email") ?? "";

  const handleStep1Success = (data: Step1Data) => {
    saveRegistrationDraft(data);
    router.push("/inscription/etape-2");
  };

  return (
    <AuthSplitLayout
      quote="La confiance se construit avant le premier invité."
      author={{ name: "Equipe Elintys", title: "Onboarding premium" }}
      progressStep={1}
      progressTotal={2}
      backHref="/"
      backLabel="Retour à l'accueil"
    >
      <RegisterStep1Form
        onSuccess={handleStep1Success}
        emailTakenError={emailTakenError}
        initialEmail={initialEmail}
      />
    </AuthSplitLayout>
  );
}

export default function InscriptionEtape1Page() {
  return (
    <Suspense>
      <InscriptionEtape1Content />
    </Suspense>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { RegisterStep1Form, type Step1Data } from "./RegisterStep1Form";
import { saveRegistrationDraft } from "@/lib/auth/registration-draft";

interface RegisterStep1ClientProps {
  emailTakenError: string | null;
  initialEmail: string;
}

/**
 * Enveloppe cliente minimale de la première étape d'inscription.
 *
 * Elle ne porte que ce qui exige le navigateur — navigation et brouillon
 * local. Les valeurs issues de l'URL sont résolues côté serveur et reçues en
 * props, ce qui permet de rendre le formulaire dans le HTML initial.
 */
export function RegisterStep1Client({ emailTakenError, initialEmail }: RegisterStep1ClientProps) {
  const router = useRouter();

  const handleStep1Success = (data: Step1Data) => {
    saveRegistrationDraft(data);
    router.push("/inscription/etape-2");
  };

  return (
    <RegisterStep1Form
      onSuccess={handleStep1Success}
      emailTakenError={emailTakenError}
      initialEmail={initialEmail}
    />
  );
}

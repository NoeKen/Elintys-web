"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { RegisterStep1Form, type Step1Data } from "@/features/auth/components/RegisterStep1Form";
import { RegisterStep2RoleSelector } from "@/features/auth/components/RegisterStep2RoleSelector";
import { authService } from "@/features/auth/client/auth.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/constants/routes";

const stepOut = { x: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } };
const step2Enter = { x: 40, opacity: 0 };
const step2Show = { x: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } };

export default function InscriptionPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [emailTakenError, setEmailTakenError] = useState<string | null>(null);

  const handleStep1Success = (data: Step1Data) => {
    setStep1Data(data);
    setEmailTakenError(null);
    setStep(2);
  };

  const handleRegister = async (role: string) => {
    if (!step1Data) return;
    const session = await authService.register({ ...step1Data, role }).catch((err: unknown) => {
      const authErr = err as { code?: string };
      if (authErr?.code === "EMAIL_TAKEN") {
        setEmailTakenError("Cet email est déjà utilisé par un autre compte.");
        setStep(1);
      }
      throw err;
    });
    login(session);
    router.push(`/verification-email?email=${encodeURIComponent(step1Data.email)}`);
  };

  const layoutPropsStep1 = {
    quote:
      "La gestion d'événements n'est pas seulement une question d'organisation, c'est l'art de créer des moments mémorables.",
    author: { name: "Julien Vasseur", title: "Directeur de Création, Montréal" },
    progressStep: 1,
    progressTotal: 2,
  } as const;

  const layoutPropsStep2 = {
    headline: "Créez des moments d'exception.",
    subheadline: '"Le design est le silence qui rend l\'événement éloquent."',
    progressStep: 2,
    progressTotal: 2,
  } as const;

  const layoutProps = step === 1 ? layoutPropsStep1 : layoutPropsStep2;

  return (
    <AuthSplitLayout {...layoutProps} backHref="/" backLabel="Retour à l'accueil">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 1, x: 0 }}
            exit={stepOut}
          >
            <RegisterStep1Form
              onSuccess={handleStep1Success}
              emailTakenError={emailTakenError}
            />
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={step2Enter}
            animate={step2Show}
          >
            <RegisterStep2RoleSelector onSubmit={handleRegister} />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthSplitLayout>
  );
}

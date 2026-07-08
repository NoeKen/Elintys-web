import { Suspense } from "react";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function ConnexionPage() {
  return (
    <AuthSplitLayout
      headline="L'événement parfait commence ici."
      showSocialProof={true}
      backHref="/"
      backLabel="Retour à l'accueil"
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}

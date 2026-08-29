import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { RegisterStep1Client } from "@/features/auth/components/RegisterStep1Client";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";

const EMAIL_TAKEN_MESSAGE =
  "Un compte existe déjà avec cette adresse courriel. Connectez-vous ou utilisez une autre adresse.";

interface InscriptionEtape1PageProps {
  searchParams: Promise<{ error?: string; email?: string; redirect?: string }>;
}

export default async function InscriptionEtape1Page({ searchParams }: InscriptionEtape1PageProps) {
  // Les paramètres sont lus côté serveur : le formulaire n'a plus besoin de
  // `useSearchParams`, qui excluait la page entière du rendu serveur et
  // repoussait son premier rendu à l'hydratation.
  const { error, email, redirect } = await searchParams;

  return (
    <AuthSplitLayout
      quote="La confiance se construit avant le premier invité."
      author={{ name: "Equipe Elintys", title: "Onboarding premium" }}
      progressStep={1}
      progressTotal={2}
      backHref="/"
      backLabel="Retour à l'accueil"
    >
      <RegisterStep1Client
        emailTakenError={error === "email-taken" ? EMAIL_TAKEN_MESSAGE : null}
        initialEmail={email ?? ""}
        redirectTo={sanitizeRedirectPath(redirect ?? null) ?? undefined}
      />
    </AuthSplitLayout>
  );
}

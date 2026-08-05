import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";

interface ConnexionPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function ConnexionPage({ searchParams }: ConnexionPageProps) {
  // La destination est lue et assainie côté serveur : le formulaire n'a plus
  // besoin de `useSearchParams`, il est donc rendu dans le HTML initial.
  const { redirect } = await searchParams;

  return (
    <AuthSplitLayout
      headline="L'événement parfait commence ici."
      showSocialProof={true}
      backHref="/"
      backLabel="Retour à l'accueil"
    >
      <LoginForm redirectTo={sanitizeRedirectPath(redirect ?? null) ?? undefined} />
    </AuthSplitLayout>
  );
}

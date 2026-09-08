"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { getLoginPath } from "@/lib/auth/redirects";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isSessionUnavailable, retrySession } = useAuth();
  const router = useRouter();

  // Redirection UNIQUEMENT sur une absence de session confirmée. Une panne de
  // restauration ne doit pas déconnecter un utilisateur qui a une session
  // valide : c'est une panne d'API, pas une fin de session.
  const shouldRedirect = !isLoading && !isAuthenticated && !isSessionUnavailable;

  useEffect(() => {
    if (shouldRedirect) {
      const returnPath = `${window.location.pathname}${window.location.search}`;
      router.replace(getLoginPath(returnPath));
    }
  }, [shouldRedirect, router]);

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        role="status"
        aria-label="Vérification de la session"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  if (isSessionUnavailable) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div
          className="max-w-md rounded-xl bg-destructive/5 p-6 text-center shadow-card"
          role="alert"
          data-testid="session-unavailable"
        >
          <p className="font-medium text-navy">
            Impossible de vérifier votre session pour le moment.
          </p>
          <p className="mt-1 text-sm text-muted">
            Vous n’avez pas été déconnecté : le service est momentanément indisponible.
          </p>
          <button
            type="button"
            onClick={retrySession}
            className="mt-4 min-h-11 rounded-lg bg-teal px-6 py-2 text-sm font-medium text-white"
            data-testid="session-retry"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return null;
}

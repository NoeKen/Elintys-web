"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLoginPath, getPostAuthPath } from "@/lib/auth/redirects";
import { useAuth } from "@/shared/hooks/useAuth";

const GUEST_ONLY_PREFIXES = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function LoadingSession() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
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

export function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isOnboarding = matchesPrefix(pathname, ["/onboarding"]);
  const isGuestOnly = matchesPrefix(pathname, GUEST_ONLY_PREFIXES);

  useEffect(() => {
    if (isLoading) return;

    if (isOnboarding && !isAuthenticated) {
      const returnPath = `${window.location.pathname}${window.location.search}`;
      router.replace(getLoginPath(returnPath));
      return;
    }

    if (isGuestOnly && isAuthenticated && user) {
      router.replace(getPostAuthPath(user));
    }
  }, [isAuthenticated, isGuestOnly, isLoading, isOnboarding, router, user]);

  if (isOnboarding && (isLoading || !isAuthenticated)) {
    return <LoadingSession />;
  }

  if (isGuestOnly && !isLoading && isAuthenticated) {
    return <LoadingSession />;
  }

  return <>{children}</>;
}

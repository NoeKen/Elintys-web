"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { getLoginPath } from "@/lib/auth/redirects";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnPath = `${window.location.pathname}${window.location.search}`;
      router.replace(getLoginPath(returnPath));
    }
  }, [isAuthenticated, isLoading, router]);

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

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

"use client";

import { useAuth } from "./useAuth";

/**
 * Signal de compatibilité pour les hooks React Query historiques.
 * Le jeton réel reste exclusivement dans les cookies HTTP-only de l'API.
 */
export function useAuthToken(): string {
  const { session } = useAuth();
  return session ? "cookie-session" : "";
}

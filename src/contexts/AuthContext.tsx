"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AuthSession, User } from "@/shared/types";
import { authService } from "@/features/auth/client/auth.service";

interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * La restauration de session a échoué pour une raison TRANSITOIRE (5xx,
   * 429, panne réseau) : l'état d'authentification est inconnu, pas absent.
   */
  isSessionUnavailable: boolean;
  /** Relance une restauration après un échec transitoire. */
  retrySession: () => void;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionUnavailable, setIsSessionUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const loggedInManuallyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    void authService
      .restoreSession()
      .then((restored) => {
        // Une connexion manuelle survenue entre-temps fait autorité : la
        // restauration de montage ne doit pas l'écraser.
        if (cancelled || loggedInManuallyRef.current) return;

        if (restored.status === "authenticated") {
          setSession(restored.session);
          setIsSessionUnavailable(false);
          return;
        }

        if (restored.status === "anonymous") {
          // Absence CONFIRMÉE : le client a déjà tenté un rafraîchissement.
          setSession(null);
          setIsSessionUnavailable(false);
          return;
        }

        // Panne transitoire : on ne détruit PAS une session déjà connue et on
        // ne prétend pas que l'utilisateur est anonyme. Transformer une panne
        // d'API en déconnexion est précisément le défaut corrigé ici.
        setIsSessionUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retrySession = useCallback(() => {
    setIsSessionUnavailable(false);
    // Réessai à la DEMANDE, jamais en boucle : un réessai automatique répété
    // sur une API en difficulté l'aggrave et peut déclencher le rate-limit.
    setAttempt((value) => value + 1);
  }, []);

  const login = useCallback((newSession: AuthSession) => {
    loggedInManuallyRef.current = true;
    setSession(newSession);
    setIsSessionUnavailable(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      loggedInManuallyRef.current = false;
      setSession(null);
      setIsSessionUnavailable(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: !!session,
      isLoading,
      isSessionUnavailable,
      retrySession,
      login,
      logout,
    }),
    [session, isLoading, isSessionUnavailable, retrySession, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

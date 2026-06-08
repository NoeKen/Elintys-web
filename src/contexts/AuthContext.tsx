"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthSession, User } from "@/shared/types";
import { setAuthToken, setRefreshTokenFn } from "@/shared/lib/api";
import { authService } from "@/features/auth/client/auth.service";

interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRefreshTokenFn(() => authService.refreshAccessToken());

    authService
      .refreshSession()
      .then((restoredSession) => {
        setSession(restoredSession);
        setAuthToken(restoredSession?.tokens.accessToken ?? null);
      })
      .catch(() => {
        setSession(null);
        setAuthToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((newSession: AuthSession) => {
    setSession(newSession);
    setAuthToken(newSession.tokens.accessToken);
  }, []);

  const logout = useCallback(() => {
    authService.logout().finally(() => {
      setSession(null);
      setAuthToken(null);
    });
  }, []);

  useEffect(() => {
    setRefreshTokenFn(async () => {
      const accessToken = await authService.refreshAccessToken();
      if (!accessToken) {
        logout();
        return null;
      }

      setSession((currentSession) => currentSession
        ? {
            ...currentSession,
            tokens: {
              ...currentSession.tokens,
              accessToken,
            },
          }
        : currentSession);
      return accessToken;
    });
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
    }),
    [session, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

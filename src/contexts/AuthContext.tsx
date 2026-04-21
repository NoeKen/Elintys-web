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

interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "elintys_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        if (parsed.tokens.expiresAt > Date.now()) {
          setSession(parsed);
          setAuthToken(parsed.tokens.accessToken);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newSession: AuthSession) => {
    setSession(newSession);
    setAuthToken(newSession.tokens.accessToken);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  useEffect(() => {
    setRefreshTokenFn(async () => {
      if (!session?.tokens.refreshToken) return null;
      try {
        const { default: api } = await import("@/shared/lib/api");
        const response = await api.post<{ accessToken: string; expiresAt: number }>(
          "/auth/refresh",
          { refreshToken: session.tokens.refreshToken }
        );
        const updated: AuthSession = {
          ...session,
          tokens: {
            ...session.tokens,
            accessToken: response.data.accessToken,
            expiresAt: response.data.expiresAt,
          },
        };
        login(updated);
        return response.data.accessToken;
      } catch {
        logout();
        return null;
      }
    });
  }, [session, login, logout]);

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

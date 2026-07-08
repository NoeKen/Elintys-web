"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthSession, User } from "@/shared/types";
import { authService } from "@/features/auth/client/auth.service";

interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService
      .refreshSession()
      .then((restoredSession) => setSession(restoredSession))
      .catch(() => {
        setSession(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((newSession: AuthSession) => {
    setSession(newSession);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setSession(null);
    }
  }, []);

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

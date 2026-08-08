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
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loggedInManuallyRef = useRef(false);

  useEffect(() => {
    authService
      .refreshSession()
      .then((restoredSession) => {
        if (!loggedInManuallyRef.current) setSession(restoredSession);
      })
      .catch(() => {
        if (!loggedInManuallyRef.current) setSession(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((newSession: AuthSession) => {
    loggedInManuallyRef.current = true;
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

"use client";

import type { UserRole } from "@/shared/types";
import { useAuth } from "@/shared/hooks/useAuth";

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !(user.roles ?? []).some((role) => roles.includes(role))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

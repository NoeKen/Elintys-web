"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { authService } from "../services/auth.service";
import type { LoginInput } from "../types";

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: (session) => {
      login(session);
      router.push(ROUTES.DASHBOARD.HOME);
    },
  });
}

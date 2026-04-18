import api from "@/lib/api";
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "@/lib/validators/auth";
import type { AuthResponse } from "../types";

export const authService = {
  async login(data: LoginInput): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/login", data);
    return res.data;
  },

  async register(data: RegisterInput): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/register", data);
    return res.data;
  },

  async forgotPassword(data: ForgotPasswordInput): Promise<void> {
    await api.post("/auth/forgot-password", data);
  },

  async resetPassword(data: ResetPasswordInput): Promise<void> {
    await api.post("/auth/reset-password", data);
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};

export type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "@/features/auth/schemas";

export interface AuthResponse {
  user: import("@/shared/types").User;
}

export type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "@/lib/validators/auth";

export interface AuthResponse {
  user: import("@/types").User;
  tokens: import("@/types").AuthTokens;
}

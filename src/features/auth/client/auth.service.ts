import type { AuthSession, User, AuthTokens } from "@/shared/types";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function mockSession(email: string, fullName?: string): AuthSession {
  const parts = (fullName ?? "Jean Dupont").split(" ");
  const user: User = {
    id: "mock-user-" + Math.random().toString(36).slice(2),
    email,
    firstName: parts[0] ?? "Jean",
    lastName: parts.slice(1).join(" ") || "Dupont",
    role: "organizer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const tokens: AuthTokens = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresAt: Date.now() + 3600 * 1000,
  };
  return { user, tokens };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export const authService = {
  async login(data: LoginData): Promise<AuthSession> {
    await delay(1200);
    if (data.email === "error@test.com") {
      throw { code: "INVALID_CREDENTIALS" };
    }
    return mockSession(data.email);
  },

  async register(data: RegisterData): Promise<AuthSession> {
    await delay(1200);
    if (data.email === "taken@test.com") {
      throw { code: "EMAIL_TAKEN" };
    }
    return mockSession(data.email, data.fullName);
  },

  async forgotPassword(_email: string): Promise<void> {
    await delay(1200);
  },

  async resetPassword(token: string, _newPassword: string): Promise<void> {
    await delay(1200);
    if (token === "invalid-token") {
      throw { code: "TOKEN_EXPIRED" };
    }
  },

  async verifyEmailCheck(_email: string): Promise<void> {
    await delay(1200);
  },

  async resendVerification(_email: string): Promise<void> {
    await delay(1200);
  },

  async logout(): Promise<void> {
    await delay(200);
  },
};

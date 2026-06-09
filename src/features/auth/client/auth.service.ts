import type { AxiosError } from "axios";
import api, { setAuthToken } from "@/shared/lib/api";
import type { AuthSession, User, UserRole } from "@/shared/types";

const USER_ROLES: UserRole[] = [
  "organisateur",
  "prestataire",
  "gestionnaire_salle",
  "participant",
];

function toUserRole(role?: string): UserRole {
  return USER_ROLES.find((userRole) => userRole === role) ?? "organisateur";
}

interface ApiUser {
  _id?: string;
  id?: string;
  fullName?: string;
  email: string;
  roles?: string[];
  avatarUrl?: string;
  subscriptions?: Record<string, unknown>[];
  referralBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthApiResponse {
  accessToken: string;
  user: ApiUser;
}

interface RefreshApiResponse {
  accessToken: string;
}

function decodeAccessTokenExpiresAt(accessToken: string): number {
  try {
    const [, payload] = accessToken.split(".");
    if (!payload) return Date.now() + 15 * 60 * 1000;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalizedPayload)) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;
  } catch {
    return Date.now() + 15 * 60 * 1000;
  }
}

function normalizeUser(apiUser: ApiUser): User {
  const [firstName = "", ...lastNameParts] = (apiUser.fullName ?? "").trim().split(/\s+/);
  const roles = (apiUser.roles ?? [])
    .map((role) => USER_ROLES.find((userRole) => userRole === role))
    .filter((role): role is UserRole => Boolean(role));

  return {
    id: apiUser.id ?? apiUser._id ?? "",
    email: apiUser.email,
    firstName,
    lastName: lastNameParts.join(" "),
    roles,
    role: roles[0],
    avatarUrl: apiUser.avatarUrl,
    subscriptions: apiUser.subscriptions ?? [],
    referralBalance: apiUser.referralBalance ?? 0,
    createdAt: apiUser.createdAt ?? "",
    updatedAt: apiUser.updatedAt ?? "",
  };
}

function buildSession({ accessToken, user }: AuthApiResponse): AuthSession {
  return {
    user: normalizeUser(user),
    tokens: {
      accessToken,
      expiresAt: decodeAccessTokenExpiresAt(accessToken),
    },
  };
}

function toAuthError(error: unknown): { code: string } {
  const status = (error as AxiosError).response?.status;
  if (status === 401) return { code: "INVALID_CREDENTIALS" };
  if (status === 409) return { code: "EMAIL_TAKEN" };
  if (status === 400) return { code: "BAD_REQUEST" };
  return { code: "UNKNOWN_ERROR" };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export const authService = {
  async login(data: LoginData): Promise<AuthSession> {
    try {
      const response = await api.post<AuthApiResponse>("/auth/login", data);
      const session = buildSession(response.data);
      setAuthToken(session.tokens.accessToken);
      return session;
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async register(data: RegisterData): Promise<AuthSession> {
    try {
      const response = await api.post<AuthApiResponse>("/auth/register", {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        roles: [toUserRole(data.role)],
      });
      const session = buildSession(response.data);
      setAuthToken(session.tokens.accessToken);
      return session;
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await api.post<RefreshApiResponse>("/auth/refresh");
      setAuthToken(response.data.accessToken);
      return response.data.accessToken;
    } catch {
      setAuthToken(null);
      return null;
    }
  },

  async refreshSession(): Promise<AuthSession | null> {
    const accessToken = await this.refreshAccessToken();
    if (!accessToken) return null;

    try {
      const response = await api.get<ApiUser>("/auth/me");
      return buildSession({ accessToken, user: response.data });
    } catch {
      setAuthToken(null);
      return null;
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.post("/auth/reset-password", { token, password: newPassword });
    } catch (error) {
      const status = (error as AxiosError).response?.status;
      throw { code: status === 400 ? "TOKEN_EXPIRED" : "UNKNOWN_ERROR" };
    }
  },

  async verifyEmailCheck(token: string): Promise<void> {
    await api.post("/auth/verify-email", { token });
  },

  async resendVerification(email: string): Promise<void> {
    await api.post("/auth/resend-verification", { email });
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      setAuthToken(null);
    }
  },
};

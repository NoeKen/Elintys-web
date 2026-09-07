import api, { ApiClientError } from "@/shared/lib/api";
import type { AuthSession, User, UserRole } from "@/shared/types";

const USER_ROLES: UserRole[] = [
  "organisateur",
  "prestataire",
  "gestionnaire_salle",
  "participant",
];

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
  isEmailVerified?: boolean;
  onboardingCompleted?: boolean;
  onboardingByRole?: Record<string, boolean>;
  onboardingData?: Record<string, Record<string, string | string[] | number>>;
}

interface AuthApiResponse {
  user: ApiUser;
}

function normalizeUser(apiUser: ApiUser): User {
  const [firstName = "", ...lastNameParts] = (apiUser.fullName ?? "")
    .trim()
    .split(/\s+/);
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
    isEmailVerified: apiUser.isEmailVerified ?? false,
    onboardingCompleted: apiUser.onboardingCompleted ?? false,
    onboardingByRole: apiUser.onboardingByRole ?? {},
    onboardingData: apiUser.onboardingData ?? {},
  };
}

function buildSession(user: ApiUser): AuthSession {
  return { user: normalizeUser(user) };
}

function getApiMessage(error: unknown): string | undefined {
  if (!(error instanceof ApiClientError)) return undefined;
  const payload = error.payload;
  if (!payload || typeof payload !== "object" || !("message" in payload))
    return undefined;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (Array.isArray(message))
    return message
      .filter((item): item is string => typeof item === "string")
      .join(" ");
  return undefined;
}

function toAuthError(error: unknown): { code: string; message?: string } {
  const status = error instanceof ApiClientError ? error.status : 0;
  const message = getApiMessage(error);
  if (status === 401) return { code: "INVALID_CREDENTIALS", message };
  if (status === 409) return { code: "EMAIL_TAKEN", message };
  if (status === 400) return { code: "BAD_REQUEST", message };
  return { code: "UNKNOWN_ERROR" };
}

/**
 * Issue d'une tentative de restauration de session.
 *
 * `unavailable` est volontairement distinct de `anonymous` : seul le second
 * autorise une redirection vers la connexion.
 */
export type SessionRestoration =
  | { status: "authenticated"; session: AuthSession }
  | { status: "anonymous" }
  | { status: "unavailable"; error: unknown };

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  roles: UserRole[];
}

export type OnboardingRole =
  "organisateur" | "prestataire" | "gestionnaire_salle";
export type OnboardingPayload = Record<string, string | string[] | number>;

export const authService = {
  async login(data: LoginData): Promise<AuthSession> {
    try {
      const response = await api.post<AuthApiResponse>("/auth/login", data);
      return buildSession(response.data.user);
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async register(data: RegisterData): Promise<AuthSession> {
    try {
      const response = await api.post<AuthApiResponse>("/auth/register", data);
      return buildSession(response.data.user);
    } catch (error) {
      throw toAuthError(error);
    }
  },

  /**
   * Restauration de session au démarrage de l'application.
   *
   * Le résultat est un état À TROIS BRANCHES, jamais un simple `null` :
   * confondre « pas de session » avec « je n'ai pas pu vérifier » transformait
   * n'importe quelle panne d'API en déconnexion de l'utilisateur.
   *
   * Un 401 qui arrive ici est une absence CONFIRMÉE : le client partagé a déjà
   * tenté un rafraîchissement transparent avant de le remonter.
   */
  async restoreSession(): Promise<SessionRestoration> {
    try {
      const response = await api.get<ApiUser>("/auth/me");
      return { status: "authenticated", session: buildSession(response.data) };
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        return { status: "anonymous" };
      }
      // 429, 5xx, panne réseau : l'état d'authentification reste INCONNU.
      return { status: "unavailable", error };
    }
  },

  /**
   * Session courante, ou `null` si elle n'a pas pu être établie.
   *
   * Réservé aux appelants pour qui « absente » et « indisponible » ont la même
   * conséquence — typiquement un écran qui va rediriger de toute façon. La
   * restauration au démarrage doit utiliser `restoreSession`.
   */
  async refreshSession(): Promise<AuthSession | null> {
    const restored = await authService.restoreSession();
    return restored.status === "authenticated" ? restored.session : null;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.post("/auth/reset-password", { token, password: newPassword });
    } catch (error) {
      const status = error instanceof ApiClientError ? error.status : 0;
      throw { code: status === 400 ? "TOKEN_EXPIRED" : "UNKNOWN_ERROR" };
    }
  },

  async verifyEmailCheck(token: string): Promise<void> {
    await api.post("/auth/verify-email", { token });
  },

  async resendVerification(email: string): Promise<void> {
    await api.post("/auth/resend-verification", { email });
  },

  async saveOnboarding(
    role: OnboardingRole,
    payload: OnboardingPayload,
  ): Promise<AuthSession> {
    const response = await api.patch<AuthApiResponse>(
      `/auth/onboarding/${role}`,
      payload,
    );
    return buildSession(response.data.user);
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};

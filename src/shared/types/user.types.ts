export type UserRole =
  | "organisateur"
  | "prestataire"
  | "gestionnaire_salle"
  | "participant";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  role?: UserRole;
  avatarUrl?: string;
  subscriptions: Record<string, unknown>[];
  referralBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresAt: number;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

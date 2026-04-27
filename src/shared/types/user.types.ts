export type UserRole =
  | "organisateur"
  | "prestataire"
  | "gestionnaire"
  | "participant";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  roles: UserRole[];
  avatarUrl?: string;
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

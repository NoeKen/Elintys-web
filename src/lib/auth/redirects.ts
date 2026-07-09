import type { User, UserRole } from "@/shared/types";

const ONBOARDING_ROUTES: Record<Exclude<UserRole, "participant">, string> = {
  organisateur: "/onboarding/organisateur",
  prestataire: "/onboarding/prestataire",
  gestionnaire_salle: "/onboarding/gestionnaire",
};

export function getFirstOnboardingPath(roles: UserRole[]): string {
  if (roles.includes("organisateur")) return ONBOARDING_ROUTES.organisateur;
  if (roles.includes("prestataire")) return ONBOARDING_ROUTES.prestataire;
  if (roles.includes("gestionnaire_salle")) return ONBOARDING_ROUTES.gestionnaire_salle;
  return "/tableau-de-bord";
}

export function getPostAuthPath(user: User): string {
  if (!user.onboardingCompleted) {
    return getFirstOnboardingPath(user.roles);
  }

  return "/tableau-de-bord";
}

export function sanitizeRedirectPath(value: string | null): string | null {
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\"))
      return null;
    if (/[\u0000-\u001F\u007F]/.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

import type { User, UserRole } from "@/shared/types";
import { getRoleHomePath } from "@/shared/layout/sidebar-nav";

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

/**
 * Écran d'atterrissage après connexion.
 *
 * Renvoyait `/tableau-de-bord` pour tous les rôles. Or cet écran rend
 * l'expérience ORGANISATEUR, protégée par `@Roles(ORGANISATEUR, ADMIN)` côté
 * API : un prestataire ou un gestionnaire recevait donc un 403 comme PREMIER
 * écran après s'être connecté.
 *
 * La destination est désormais dérivée du rôle dominant, via la même source
 * que la navigation. La priorité entre rôles est celle qu'applique déjà
 * `getFirstOnboardingPath` ; aucune seconde politique n'est introduite.
 */
export function getPostAuthPath(user: User): string {
  if (!user.onboardingCompleted) {
    return getFirstOnboardingPath(user.roles);
  }

  return getRoleHomePath(user.roles);
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

export function getLoginPath(returnPath: string): string {
  const safePath = sanitizeRedirectPath(returnPath) ?? "/tableau-de-bord";
  const params = new URLSearchParams({ redirect: safePath });
  return `/connexion?${params.toString()}`;
}

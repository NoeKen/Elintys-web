import type { UserRole } from "@/shared/types/user.types";

export type SidebarIconName =
  | "grid"
  | "calendar"
  | "users"
  | "building"
  | "message-square"
  | "star"
  | "inbox"
  | "handshake"
  | "map-pin"
  | "calendar-check"
  | "calendar-days"
  | "ticket"
  | "heart"
  | "search"
  | "settings"
  | "star-half";

export interface NavItem {
  label: string;
  href: string;
  icon: SidebarIconName;
  badge?: number;
  /**
   * Écran encore non implémenté (placeholder ou stub historique).
   *
   * La barre latérale les affiche toujours — c'est le comportement desktop
   * existant — mais la navigation mobile, limitée à quelques emplacements, ne
   * dépense pas une place sur un écran qui ne fait rien.
   */
  placeholder?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavCounts {
  unreadMessages?: number;
  pendingRequests?: number;
}

export function buildNavSections(
  roles: UserRole[],
  counts?: NavCounts
): NavSection[] {
  const sections: NavSection[] = [];

  if (roles.includes("organisateur")) {
    sections.push({
      label: "Organisateur",
      items: [
        {
          label: "Tableau de bord",
          href: "/tableau-de-bord",
          icon: "grid",
        },
        {
          label: "Mes événements",
          href: "/tableau-de-bord/evenements",
          icon: "calendar",
        },
        {
          label: "Prestataires",
          href: "/tableau-de-bord/prestataires",
          icon: "users",
          placeholder: true,
        },
        {
          label: "Lieux",
          href: "/tableau-de-bord/lieux",
          icon: "building",
          placeholder: true,
        },
        {
          label: "Messages",
          href: "/tableau-de-bord/messages",
          icon: "message-square",
          badge: counts?.unreadMessages,
          placeholder: true,
        },
      ],
    });
  }

  if (roles.includes("prestataire")) {
    sections.push({
      label: "Prestataire",
      items: [
        {
          label: "Mon profil",
          href: "/tableau-de-bord/prestataire/profil",
          icon: "star",
        },
        {
          label: "Demandes reçues",
          href: "/tableau-de-bord/prestataire/demandes",
          icon: "inbox",
          badge: counts?.pendingRequests,
        },
        {
          label: "Mes ententes",
          href: "/tableau-de-bord/prestataire/ententes",
          icon: "handshake",
          placeholder: true,
        },
        {
          label: "Mes avis",
          href: "/tableau-de-bord/prestataire/avis",
          icon: "star-half",
          placeholder: true,
        },
      ],
    });
  }

  if (roles.includes("gestionnaire_salle")) {
    sections.push({
      label: "Gestionnaire de lieu",
      items: [
        {
          label: "Ma fiche lieu",
          href: "/tableau-de-bord/gestionnaire/fiche",
          icon: "map-pin",
        },
        {
          label: "Réservations",
          href: "/tableau-de-bord/gestionnaire/reservations",
          icon: "calendar-check",
          badge: counts?.pendingRequests,
        },
        {
          label: "Calendrier",
          href: "/tableau-de-bord/gestionnaire/calendrier",
          icon: "calendar-days",
          placeholder: true,
        },
        {
          label: "Mes ententes",
          href: "/tableau-de-bord/gestionnaire/ententes",
          icon: "handshake",
          placeholder: true,
        },
      ],
    });
  }

  if (roles.includes("participant")) {
    sections.push({
      label: "Participant",
      items: [
        {
          label: "Ma participation",
          href: "/tableau-de-bord/participation",
          icon: "ticket",
        },
      ],
    });
  }

  sections.push({
    label: "",
    items: [
      {
        label: "Mes favoris",
        href: "/tableau-de-bord/favoris",
        icon: "heart",
      },
      {
        label: "Découvrir",
        href: "/evenements",
        icon: "search",
      },
      {
        label: "Paramètres",
        href: "/parametres",
        icon: "settings",
        placeholder: true,
      },
    ],
  });

  return sections;
}

/**
 * Priorité des rôles.
 *
 * Reprend l'ordre déjà appliqué par `getFirstOnboardingPath` — organisateur,
 * puis prestataire, puis gestionnaire de salle — au lieu d'en inventer un
 * second. `participant` vient en dernier : c'est le rôle par défaut de tout
 * compte, il ne doit pas primer sur un rôle métier explicite.
 */
export const ROLE_PRIORITY: readonly UserRole[] = [
  "organisateur",
  "prestataire",
  "gestionnaire_salle",
  "participant",
];

/** Écran d'accueil de chaque rôle, seulement des routes réellement fonctionnelles. */
const ROLE_HOME: Record<UserRole, string> = {
  organisateur: "/tableau-de-bord",
  prestataire: "/tableau-de-bord/prestataire/profil",
  gestionnaire_salle: "/tableau-de-bord/gestionnaire/fiche",
  participant: "/tableau-de-bord/participation",
};

/** Rôle dominant d'un compte multi-rôles, selon `ROLE_PRIORITY`. */
export function getPrimaryRole(roles: readonly UserRole[]): UserRole | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

/**
 * Écran d'accueil du compte.
 *
 * `/tableau-de-bord` rend l'expérience ORGANISATEUR : y envoyer un prestataire
 * ou un gestionnaire produisait un 403 comme premier écran après connexion.
 */
export function getRoleHomePath(roles: readonly UserRole[]): string {
  const primary = getPrimaryRole(roles);
  return primary ? ROLE_HOME[primary] : "/tableau-de-bord/favoris";
}

export interface MobileNavLayout {
  /** Emplacements de la barre inférieure. */
  primary: NavItem[];
  /** Reste, présenté derrière un bouton « Plus ». */
  overflow: NavItem[];
}

/** Nombre d'emplacements de la barre inférieure, « Plus » exclu. */
export const MOBILE_PRIMARY_SLOTS = 4;

/**
 * Navigation mobile, DÉRIVÉE de `buildNavSections`.
 *
 * Aucune seconde logique de rôle n'est définie ici : la barre mobile est une
 * projection de la même source que la barre latérale. Avant ce correctif elle
 * était codée en dur et ignorait `user.roles`, si bien qu'un prestataire ou un
 * gestionnaire n'avait, sous 768 px, aucun chemin vers ses propres écrans.
 *
 * Les placeholders sont écartés : les emplacements sont rares, et en dépenser
 * un sur un écran qui ne fait rien serait une affordance mensongère.
 */
export function buildMobileNav(
  roles: UserRole[],
  counts?: NavCounts,
): MobileNavLayout {
  const items = buildNavSections(roles, counts)
    .flatMap((section) => section.items)
    .filter((item) => !item.placeholder);

  return {
    primary: items.slice(0, MOBILE_PRIMARY_SLOTS),
    overflow: items.slice(MOBILE_PRIMARY_SLOTS),
  };
}

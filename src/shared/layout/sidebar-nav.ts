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
        },
        {
          label: "Lieux",
          href: "/tableau-de-bord/lieux",
          icon: "building",
        },
        {
          label: "Messages",
          href: "/tableau-de-bord/messages",
          icon: "message-square",
          badge: counts?.unreadMessages,
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
        },
        {
          label: "Mes avis",
          href: "/tableau-de-bord/prestataire/avis",
          icon: "star-half",
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
        },
        {
          label: "Mes ententes",
          href: "/tableau-de-bord/gestionnaire/ententes",
          icon: "handshake",
        },
      ],
    });
  }

  if (roles.includes("participant")) {
    sections.push({
      label: "Participant",
      items: [
        {
          label: "Mes billets",
          href: "/tableau-de-bord/participant/billets",
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
        href: "/tableau-de-bord/parametres",
        icon: "settings",
      },
    ],
  });

  return sections;
}

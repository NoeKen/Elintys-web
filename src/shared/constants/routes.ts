export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/connexion",
    REGISTER: "/inscription",
    FORGOT_PASSWORD: "/mot-de-passe-oublie",
    RESET_PASSWORD: "/reinitialiser-mot-de-passe",
    VERIFY_EMAIL: "/verification-email",
  },
  DASHBOARD: {
    HOME: "/tableau-de-bord",
    EVENTS: "/evenements",
    VENDORS: "/prestataires",
    GUESTS: "/invites",
    TICKETS: "/billetterie",
    SETTINGS: "/parametres",
  },
} as const;

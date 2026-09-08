/**
 * Routes dashboard historiques dont la destination canonique est sans
 * ambiguite. La liste est statique : aucune valeur fournie par une requete ne
 * peut devenir une destination de redirection.
 */
export const legacyDashboardRedirects = [
  { source: "/organisateur", destination: "/tableau-de-bord", permanent: true },
  { source: "/organisateur/evenements", destination: "/tableau-de-bord/evenements", permanent: true },
  { source: "/organisateur/invites", destination: "/tableau-de-bord/invitations", permanent: true },
  { source: "/organisateur/prestataires", destination: "/tableau-de-bord/prestataires", permanent: true },
  { source: "/prestataire", destination: "/tableau-de-bord/prestataire/profil", permanent: true },
  { source: "/prestataire/profil", destination: "/tableau-de-bord/prestataire/profil", permanent: true },
  { source: "/prestataire/demandes", destination: "/tableau-de-bord/prestataire/demandes", permanent: true },
  { source: "/prestataire/avis", destination: "/tableau-de-bord/prestataire/avis", permanent: true },
  { source: "/gestionnaire", destination: "/tableau-de-bord/gestionnaire/fiche", permanent: true },
  { source: "/gestionnaire/lieux", destination: "/tableau-de-bord/gestionnaire/fiche", permanent: true },
  { source: "/gestionnaire/reservations", destination: "/tableau-de-bord/gestionnaire/reservations", permanent: true },
  { source: "/gestionnaire/calendrier", destination: "/tableau-de-bord/gestionnaire/calendrier", permanent: true },
] as const;

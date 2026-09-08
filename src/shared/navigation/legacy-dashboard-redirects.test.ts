import { describe, expect, it } from "vitest";
import { legacyDashboardRedirects } from "./legacy-dashboard-redirects";

describe("legacyDashboardRedirects", () => {
  it("canonicalise uniquement les anciennes routes dont la destination est certaine", () => {
    expect(legacyDashboardRedirects).toEqual([
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
    ]);
  });

  it("n'accepte que des destinations internes et ne crée aucune boucle", () => {
    for (const redirect of legacyDashboardRedirects) {
      expect(redirect.destination).toMatch(/^\/tableau-de-bord(?:\/|$)/);
      expect(redirect.destination).not.toBe(redirect.source);
      const sources: readonly string[] = legacyDashboardRedirects.map(({ source }) => source);
      expect(sources.includes(redirect.destination)).toBe(false);
    }
  });
});

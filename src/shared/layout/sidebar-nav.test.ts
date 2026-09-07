import { describe, expect, it } from "vitest";
import {
  buildMobileNav,
  buildNavSections,
  getPrimaryRole,
  getRoleHomePath,
  MOBILE_PRIMARY_SLOTS,
} from "./sidebar-nav";

describe("buildNavSections", () => {
  it("retourne uniquement la section commune si roles est vide", () => {
    const sections = buildNavSections([]);
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe("");
  });

  it("retourne la section Organisateur si rôle présent", () => {
    const sections = buildNavSections(["organisateur"]);
    const labels = sections.map((section) => section.label);
    expect(labels).toContain("Organisateur");
  });

  it("retourne plusieurs sections pour un utilisateur multi-rôles", () => {
    const sections = buildNavSections(["organisateur", "prestataire"]);
    const labels = sections.map((section) => section.label);
    expect(labels).toContain("Organisateur");
    expect(labels).toContain("Prestataire");
  });

  it("affiche le badge sur Messages si unreadMessages > 0", () => {
    const sections = buildNavSections(["organisateur"], { unreadMessages: 3 });
    const orgSection = sections.find((section) => section.label === "Organisateur");
    const messagesItem = orgSection?.items.find((item) => item.label === "Messages");
    expect(messagesItem?.badge).toBe(3);
  });

  it("n'affiche pas de badge si unreadMessages est 0", () => {
    const sections = buildNavSections(["organisateur"], { unreadMessages: 0 });
    const orgSection = sections.find((section) => section.label === "Organisateur");
    const messagesItem = orgSection?.items.find((item) => item.label === "Messages");
    expect(messagesItem?.badge).toBe(0);
  });

  it("la section commune est toujours la dernière", () => {
    const sections = buildNavSections(["organisateur", "prestataire"]);
    expect(sections[sections.length - 1].label).toBe("");
  });

  it("toutes les hrefs commencent par / ", () => {
    const sections = buildNavSections([
      "organisateur",
      "prestataire",
      "gestionnaire_salle",
      "participant",
    ]);
    sections.forEach((section) => {
      section.items.forEach((item) => {
        expect(item.href).toMatch(/^\//);
      });
    });
  });

  it("la section Participant expose un espace unifié Ma participation", () => {
    const sections = buildNavSections(["participant"]);
    const participantSection = sections.find((s) => s.label === "Participant");
    expect(participantSection).toBeDefined();
    expect(participantSection!.items).toEqual([
      expect.objectContaining({
        label: "Ma participation",
        href: "/tableau-de-bord/participation",
      }),
    ]);
  });
});

describe("getRoleHomePath", () => {
  it.each([
    [["organisateur"], "/tableau-de-bord"],
    [["prestataire"], "/tableau-de-bord/prestataire/profil"],
    [["gestionnaire_salle"], "/tableau-de-bord/gestionnaire/fiche"],
    [["participant"], "/tableau-de-bord/participation"],
  ] as const)("envoie %j vers %s", (roles, expected) => {
    // `/tableau-de-bord` rend l'expérience organisateur : y envoyer les autres
    // rôles produisait un 403 comme premier écran après connexion.
    expect(getRoleHomePath([...roles])).toBe(expected);
  });

  it("applique la priorité de rôle existante pour un compte multi-rôles", () => {
    // Même ordre que getFirstOnboardingPath : aucune seconde politique.
    expect(getRoleHomePath(["prestataire", "organisateur"])).toBe("/tableau-de-bord");
    expect(getRoleHomePath(["participant", "gestionnaire_salle"])).toBe(
      "/tableau-de-bord/gestionnaire/fiche",
    );
    expect(getRoleHomePath(["participant", "prestataire"])).toBe(
      "/tableau-de-bord/prestataire/profil",
    );
  });

  it("retombe sur un écran commun quand aucun rôle connu n'est présent", () => {
    expect(getRoleHomePath([])).toBe("/tableau-de-bord/favoris");
  });

  it("expose le rôle dominant", () => {
    expect(getPrimaryRole(["participant", "organisateur"])).toBe("organisateur");
    expect(getPrimaryRole([])).toBeNull();
  });
});

describe("buildMobileNav", () => {
  it("donne au prestataire un chemin vers SES écrans", () => {
    // Régression F-14 : la barre mobile était codée en dur et identique pour
    // tous. Sous 768 px, la barre latérale étant masquée, un prestataire
    // n'avait aucun chemin vers son profil ni ses demandes.
    const { primary, overflow } = buildMobileNav(["prestataire"]);
    const hrefs = [...primary, ...overflow].map((item) => item.href);

    expect(hrefs).toContain("/tableau-de-bord/prestataire/profil");
    expect(hrefs).toContain("/tableau-de-bord/prestataire/demandes");
  });

  it("donne au gestionnaire un chemin vers SES écrans", () => {
    const { primary, overflow } = buildMobileNav(["gestionnaire_salle"]);
    const hrefs = [...primary, ...overflow].map((item) => item.href);

    expect(hrefs).toContain("/tableau-de-bord/gestionnaire/fiche");
    expect(hrefs).toContain("/tableau-de-bord/gestionnaire/reservations");
  });

  it("donne à l'organisateur son tableau de bord et ses événements", () => {
    const { primary, overflow } = buildMobileNav(["organisateur"]);
    const hrefs = [...primary, ...overflow].map((item) => item.href);

    expect(hrefs).toContain("/tableau-de-bord");
    expect(hrefs).toContain("/tableau-de-bord/evenements");
  });

  it("n'expose jamais plus de quatre emplacements dans la barre", () => {
    const { primary } = buildMobileNav(["organisateur", "prestataire", "gestionnaire_salle"]);
    expect(primary.length).toBeLessThanOrEqual(MOBILE_PRIMARY_SLOTS);
  });

  it("place le surplus derrière « Plus » sans rien perdre", () => {
    const roles = ["organisateur", "prestataire"] as const;
    const { primary, overflow } = buildMobileNav([...roles]);
    const mobileHrefs = [...primary, ...overflow].map((item) => item.href);

    const expected = buildNavSections([...roles])
      .flatMap((section) => section.items)
      .filter((item) => !item.placeholder)
      .map((item) => item.href);

    expect(mobileHrefs).toEqual(expected);
    expect(overflow.length).toBeGreaterThan(0);
  });

  it("écarte les placeholders : un emplacement ne se dépense pas sur un écran vide", () => {
    const { primary, overflow } = buildMobileNav(["organisateur"]);
    const hrefs = [...primary, ...overflow].map((item) => item.href);

    expect(hrefs).not.toContain("/tableau-de-bord/messages");
    expect(hrefs).not.toContain("/tableau-de-bord/prestataires");
    expect(hrefs).not.toContain("/parametres");
  });

  it("dérive de la MÊME source que la barre latérale", () => {
    // Aucune seconde logique de rôle : la barre mobile est une projection.
    const sections = buildNavSections(["prestataire"]);
    const { primary, overflow } = buildMobileNav(["prestataire"]);

    const fromSections = sections
      .flatMap((section) => section.items)
      .filter((item) => !item.placeholder);
    expect([...primary, ...overflow]).toEqual(fromSections);
  });

  it("ne rend aucun emplacement pour un compte sans rôle exploitable", () => {
    const { primary } = buildMobileNav([]);
    // Section commune uniquement : favoris et découvrir restent accessibles.
    expect(primary.map((item) => item.href)).toEqual([
      "/tableau-de-bord/favoris",
      "/evenements",
    ]);
  });
});

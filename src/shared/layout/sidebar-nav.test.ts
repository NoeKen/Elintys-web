import { describe, expect, it } from "vitest";
import { buildNavSections } from "./sidebar-nav";

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
});

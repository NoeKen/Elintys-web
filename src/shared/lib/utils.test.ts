import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cn,
  formatDate,
  formatPrice,
  formatRole,
  getInitials,
  slugify,
  truncate,
} from "./utils";

describe("cn", () => {
  it("fusionne les classes et résout les conflits Tailwind", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn("text-teal", false, undefined, null, "font-bold")).toBe("text-teal font-bold");
  });
});

describe("formatDate", () => {
  it("formate une date longue par défaut", () => {
    const result = formatDate(new Date("2026-06-15T00:00:00.000Z"));
    expect(result).toContain("2026");
  });

  it("accepte une date sous forme de chaîne", () => {
    const result = formatDate("2026-06-15T00:00:00.000Z", "short");
    expect(result).toContain("2026");
  });

  describe("format relatif", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("retourne \"À l'instant\" pour moins d'une minute", () => {
      const d = new Date("2026-06-15T11:59:30.000Z");
      expect(formatDate(d, "relative")).toBe("À l'instant");
    });

    it("retourne les minutes écoulées", () => {
      const d = new Date("2026-06-15T11:45:00.000Z");
      expect(formatDate(d, "relative")).toBe("Il y a 15 min");
    });

    it("retourne les heures écoulées", () => {
      const d = new Date("2026-06-15T08:00:00.000Z");
      expect(formatDate(d, "relative")).toBe("Il y a 4 h");
    });

    it("retourne les jours écoulés", () => {
      const d = new Date("2026-06-12T12:00:00.000Z");
      expect(formatDate(d, "relative")).toBe("Il y a 3 j");
    });

    it("retombe sur le format long si plus de 7 jours", () => {
      const d = new Date("2026-05-01T12:00:00.000Z");
      const result = formatDate(d, "relative");
      expect(result).not.toMatch(/^Il y a|À l'instant/);
    });
  });
});

describe("formatPrice", () => {
  it("formate un montant en CAD par défaut", () => {
    expect(formatPrice(75)).toContain("75");
  });

  it("accepte une devise personnalisée", () => {
    const result = formatPrice(50, "USD");
    expect(result).toContain("50");
  });
});

describe("formatRole", () => {
  it("traduit un rôle connu", () => {
    expect(formatRole("admin")).toBe("Administrateur");
    expect(formatRole("organizer")).toBe("Organisateur");
    expect(formatRole("vendor")).toBe("Prestataire");
    expect(formatRole("guest")).toBe("Invité");
  });

  it("est insensible à la casse", () => {
    expect(formatRole("ADMIN")).toBe("Administrateur");
  });

  it("retourne le rôle brut si inconnu", () => {
    expect(formatRole("mystere")).toBe("mystere");
  });
});

describe("slugify", () => {
  it("convertit en minuscules et remplace les espaces par des tirets", () => {
    expect(slugify("Festival d'été")).toBe("festival-dete");
  });

  it("supprime les accents", () => {
    expect(slugify("Événement Privé")).toBe("evenement-prive");
  });

  it("supprime les tirets en début et fin", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });

  it("supprime les caractères spéciaux", () => {
    expect(slugify("Prix: 100$ !")).toBe("prix-100");
  });
});

describe("truncate", () => {
  it("ne tronque pas si le texte est plus court que la limite", () => {
    expect(truncate("court", 10)).toBe("court");
  });

  it("tronque et ajoute une ellipse si le texte dépasse la limite", () => {
    expect(truncate("un texte assez long", 8)).toBe("un texte…");
  });
});

describe("getInitials", () => {
  it("retourne une chaîne vide pour un nom vide", () => {
    expect(getInitials("   ")).toBe("");
  });

  it("retourne une seule initiale pour un prénom seul", () => {
    expect(getInitials("Jane")).toBe("J");
  });

  it("retourne les initiales du prénom et du nom", () => {
    expect(getInitials("Jane Doe")).toBe("JD");
  });

  it("ignore les noms composés du milieu", () => {
    expect(getInitials("Jane Middle Doe")).toBe("JD");
  });
});

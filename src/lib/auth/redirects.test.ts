import { describe, expect, it } from "vitest";
import type { User } from "@/shared/types";
import { getFirstOnboardingPath, getPostAuthPath, sanitizeRedirectPath } from "./redirects";

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    email: "user@example.com",
    firstName: "Jane",
    lastName: "Doe",
    roles: ["participant"],
    subscriptions: [],
    referralBalance: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    isEmailVerified: true,
    onboardingCompleted: true,
    onboardingByRole: {},
    onboardingData: {},
    ...overrides,
  };
}

describe("getFirstOnboardingPath", () => {
  it("priorise organisateur si plusieurs rôles présents", () => {
    expect(getFirstOnboardingPath(["prestataire", "organisateur"])).toBe(
      "/onboarding/organisateur",
    );
  });

  it("retourne le chemin prestataire si organisateur absent", () => {
    expect(getFirstOnboardingPath(["prestataire"])).toBe("/onboarding/prestataire");
  });

  it("retourne le chemin gestionnaire si seul rôle gestionnaire_salle présent", () => {
    expect(getFirstOnboardingPath(["gestionnaire_salle"])).toBe("/onboarding/gestionnaire");
  });

  it("retourne le tableau de bord si seul rôle participant présent", () => {
    expect(getFirstOnboardingPath(["participant"])).toBe("/tableau-de-bord");
  });

  it("retourne le tableau de bord si aucun rôle", () => {
    expect(getFirstOnboardingPath([])).toBe("/tableau-de-bord");
  });
});

describe("getPostAuthPath", () => {
  it("redirige vers l'onboarding si non complété", () => {
    const user = buildUser({ onboardingCompleted: false, roles: ["prestataire"] });
    expect(getPostAuthPath(user)).toBe("/onboarding/prestataire");
  });

  it("redirige vers le tableau de bord si onboarding complété", () => {
    const user = buildUser({ onboardingCompleted: true, roles: ["organisateur"] });
    expect(getPostAuthPath(user)).toBe("/tableau-de-bord");
  });
});

describe("sanitizeRedirectPath", () => {
  it("retourne null si la valeur est null", () => {
    expect(sanitizeRedirectPath(null)).toBeNull();
  });

  it("retourne null si la valeur est une chaîne vide", () => {
    expect(sanitizeRedirectPath("")).toBeNull();
  });

  it("accepte un chemin relatif valide", () => {
    expect(sanitizeRedirectPath("/tableau-de-bord/favoris")).toBe(
      "/tableau-de-bord/favoris",
    );
  });

  it("décode les caractères encodés dans un chemin valide", () => {
    expect(sanitizeRedirectPath("/%C3%A9v%C3%A9nements")).toBe("/événements");
  });

  it("rejette une valeur qui ne commence pas par /", () => {
    expect(sanitizeRedirectPath("evil.com/phishing")).toBeNull();
  });

  it("rejette un protocole-relative URL (//) pour éviter l'open redirect", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBeNull();
  });

  it("rejette un chemin contenant un backslash", () => {
    expect(sanitizeRedirectPath("/\\evil.com")).toBeNull();
  });

  it("rejette un chemin contenant des caractères de contrôle", () => {
    expect(sanitizeRedirectPath(`/foo${String.fromCharCode(1)}bar`)).toBeNull();
  });

  it("retourne null si le décodage URI échoue", () => {
    expect(sanitizeRedirectPath("/%")).toBeNull();
  });
});

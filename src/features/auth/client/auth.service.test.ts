import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, put, patch, remove } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/shared/lib/api", () => ({
  default: { get, post, put, patch, delete: remove },
  ApiClientError: class ApiClientError extends Error {
    constructor(
      public readonly status: number,
      public readonly payload: unknown,
    ) {
      super(`HTTP ${status}`);
    }
  },
}));

import { authService } from "./auth.service";
import { ApiClientError } from "@/shared/lib/api";

describe("authService.restoreSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valide d'abord le cookie d'accès via /auth/me sans rotation forcée", async () => {
    get.mockResolvedValue({
      data: {
        _id: "user-1",
        email: "test@elintys.com",
        fullName: "Ana Test",
        roles: ["organisateur"],
        onboardingCompleted: true,
      },
      status: 200,
    });

    await expect(authService.refreshSession()).resolves.toMatchObject({
      user: {
        id: "user-1",
        email: "test@elintys.com",
        firstName: "Ana",
        lastName: "Test",
        roles: ["organisateur"],
      },
    });
    expect(get).toHaveBeenCalledWith("/auth/me");
    expect(post).not.toHaveBeenCalledWith("/auth/refresh");
  });

  it("retourne null lorsque l'API ne peut pas restaurer la session", async () => {
    get.mockRejectedValue(new Error("non authentifié"));

    await expect(authService.refreshSession()).resolves.toBeNull();
  });
});

describe("authService.restoreSession — distinction absence / indisponibilité", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne `authenticated` avec la session normalisée", async () => {
    get.mockResolvedValue({
      data: {
        _id: "user-1",
        email: "test@elintys.com",
        fullName: "Ana Test",
        roles: ["organisateur"],
        onboardingCompleted: true,
      },
      status: 200,
    });

    const restored = await authService.restoreSession();

    expect(restored.status).toBe("authenticated");
  });

  it("retourne `anonymous` sur un 401 — absence confirmée", async () => {
    // Le client partagé a déjà tenté un rafraîchissement avant de remonter
    // un 401 : c'est la seule réponse qui prouve l'absence de session.
    get.mockRejectedValue(new ApiClientError(401, {}));

    await expect(authService.restoreSession()).resolves.toEqual({ status: "anonymous" });
  });

  it.each([500, 502, 503, 429])(
    "retourne `unavailable` sur un %s — l'état reste inconnu",
    async (status) => {
      get.mockRejectedValue(new ApiClientError(status, {}));

      const restored = await authService.restoreSession();

      expect(restored.status).toBe("unavailable");
    },
  );

  it("retourne `unavailable` sur une panne réseau", async () => {
    get.mockRejectedValue(new TypeError("Failed to fetch"));

    const restored = await authService.restoreSession();

    expect(restored.status).toBe("unavailable");
  });

  it("refreshSession réduit les deux échecs à null pour les appelants qui redirigent", async () => {
    get.mockRejectedValue(new ApiClientError(503, {}));

    await expect(authService.refreshSession()).resolves.toBeNull();
  });
});

describe("authService — account settings", () => {
  beforeEach(() => vi.clearAllMocks());

  const apiUser = {
    _id: "user-1",
    email: "ana@elintys.com",
    fullName: "Ana Tremblay",
    roles: ["participant", "prestataire"],
    emailNotifications: {
      vendorRequestReceived: false,
      vendorResponse: true,
      venueBookingReceived: true,
      venueResponse: false,
    },
  };

  it("met à jour le profil et normalise la session retournée", async () => {
    patch.mockResolvedValue({ data: { user: apiUser }, status: 200 });

    const session = await authService.updateProfile({ firstName: "Ana", lastName: "Tremblay" });

    expect(patch).toHaveBeenCalledWith("/auth/me/profile", {
      firstName: "Ana",
      lastName: "Tremblay",
    });
    expect(session.user).toMatchObject({ firstName: "Ana", lastName: "Tremblay" });
  });

  it("change le mot de passe sans exposer de session factice", async () => {
    post.mockResolvedValue({ data: { message: "ok" }, status: 200 });

    await authService.changePassword("AncienSecret1!", "NouveauSecret2!");

    expect(post).toHaveBeenCalledWith("/auth/me/change-password", {
      currentPassword: "AncienSecret1!",
      newPassword: "NouveauSecret2!",
    });
  });

  it("met à jour les préférences et retourne la source serveur", async () => {
    patch.mockResolvedValue({ data: { user: apiUser }, status: 200 });

    const session = await authService.updateNotificationPreferences({ venueResponse: false });

    expect(patch).toHaveBeenCalledWith("/auth/me/notification-preferences", {
      venueResponse: false,
    });
    expect(session.user.emailNotifications?.vendorRequestReceived).toBe(false);
  });

  it("ajoute un rôle via le contrat sécurisé", async () => {
    post.mockResolvedValue({ data: { user: apiUser }, status: 200 });

    const session = await authService.addRole("prestataire");

    expect(post).toHaveBeenCalledWith("/auth/me/roles", { role: "prestataire" });
    expect(session.user.roles).toContain("prestataire");
  });

  it("renvoie la vérification sans transmettre l’adresse du client", async () => {
    post.mockResolvedValue({ data: { message: "ok" }, status: 200 });

    await authService.resendMyVerification();

    expect(post).toHaveBeenCalledWith("/auth/me/resend-verification");
  });
});

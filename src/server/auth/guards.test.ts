import { afterEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const getSessionMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("./session", () => ({
  getSession: getSessionMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("redirige vers /connexion si aucune session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { requireAuth } = await import("./guards");

    await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT:/connexion");
    expect(redirectMock).toHaveBeenCalledWith("/connexion");
  });

  it("retourne la session si présente", async () => {
    const session = { id: "u1", email: "u@example.com", role: "organisateur", roles: ["organisateur"] };
    getSessionMock.mockResolvedValue(session);
    const { requireAuth } = await import("./guards");

    await expect(requireAuth()).resolves.toEqual(session);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("requireRole", () => {
  it("redirige vers le tableau de bord si le rôle n'est pas autorisé", async () => {
    const session = { id: "u1", email: "u@example.com", role: "participant", roles: ["participant"] };
    getSessionMock.mockResolvedValue(session);
    const { requireRole } = await import("./guards");

    await expect(requireRole(["organisateur"])).rejects.toThrow(
      "NEXT_REDIRECT:/tableau-de-bord",
    );
    expect(redirectMock).toHaveBeenCalledWith("/tableau-de-bord");
  });

  it("retourne la session si le rôle est autorisé", async () => {
    const session = { id: "u1", email: "u@example.com", role: "organisateur", roles: ["organisateur"] };
    getSessionMock.mockResolvedValue(session);
    const { requireRole } = await import("./guards");

    await expect(requireRole(["organisateur", "prestataire"])).resolves.toEqual(session);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirige vers /connexion si aucune session avant même de vérifier le rôle", async () => {
    getSessionMock.mockResolvedValue(null);
    const { requireRole } = await import("./guards");

    await expect(requireRole(["organisateur"])).rejects.toThrow("NEXT_REDIRECT:/connexion");
    expect(redirectMock).toHaveBeenCalledWith("/connexion");
  });
});

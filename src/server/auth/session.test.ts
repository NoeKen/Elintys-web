import { afterEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

function encodeJwtPayload(payload: Record<string, unknown>): string {
  const base64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_");
}

function buildToken(payload: Record<string, unknown>): string {
  return `header.${encodeJwtPayload(payload)}.signature`;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("getSession", () => {
  it("retourne null si aucun cookie de session n'est présent", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const { getSession } = await import("./session");
    expect(await getSession()).toBeNull();
  });

  it("retourne null si le token n'a pas de segment payload", async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === "access_token" ? { value: "not-a-jwt" } : undefined,
    );
    const { getSession } = await import("./session");
    expect(await getSession()).toBeNull();
  });

  it("retourne null si le payload décodé n'est pas du JSON valide", async () => {
    const invalidPayload = Buffer.from("not-json", "utf8").toString("base64");
    cookieStore.get.mockImplementation((name: string) =>
      name === "access_token" ? { value: `header.${invalidPayload}.signature` } : undefined,
    );
    const { getSession } = await import("./session");
    expect(await getSession()).toBeNull();
  });

  it("retourne null si le payload n'a ni sub ni email", async () => {
    const token = buildToken({ role: "organisateur" });
    cookieStore.get.mockImplementation((name: string) =>
      name === "access_token" ? { value: token } : undefined,
    );
    const { getSession } = await import("./session");
    expect(await getSession()).toBeNull();
  });

  it("retourne la session avec roles multiples à partir du payload", async () => {
    const token = buildToken({
      sub: "user-1",
      email: "user@example.com",
      roles: ["organisateur", "prestataire"],
    });
    cookieStore.get.mockImplementation((name: string) =>
      name === "access_token" ? { value: token } : undefined,
    );
    const { getSession } = await import("./session");
    expect(await getSession()).toEqual({
      id: "user-1",
      email: "user@example.com",
      role: "organisateur",
      roles: ["organisateur", "prestataire"],
    });
  });

  it("dérive roles à partir d'un rôle unique si roles est absent", async () => {
    const token = buildToken({ sub: "user-1", email: "user@example.com", role: "participant" });
    cookieStore.get.mockImplementation((name: string) =>
      name === "access_token" ? { value: token } : undefined,
    );
    const { getSession } = await import("./session");
    expect(await getSession()).toEqual({
      id: "user-1",
      email: "user@example.com",
      role: "participant",
      roles: ["participant"],
    });
  });

  it("retombe sur le refresh_token si access_token est absent", async () => {
    const token = buildToken({ sub: "user-1", email: "user@example.com" });
    cookieStore.get.mockImplementation((name: string) =>
      name === "refresh_token" ? { value: token } : undefined,
    );
    const { getSession } = await import("./session");
    expect(await getSession()).toEqual({
      id: "user-1",
      email: "user@example.com",
      role: "",
      roles: [],
    });
  });
});

describe("setSession", () => {
  it("écrit les cookies access_token et refresh_token en httpOnly", async () => {
    const { setSession } = await import("./session");
    await setSession("access-123", "refresh-456");

    expect(cookieStore.set).toHaveBeenCalledWith(
      "access_token",
      "access-123",
      expect.objectContaining({ httpOnly: true, maxAge: 60 * 15 }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-456",
      expect.objectContaining({ httpOnly: true, maxAge: 60 * 60 * 24 * 7 }),
    );
  });
});

describe("clearSession", () => {
  it("supprime les deux cookies de session", async () => {
    const { clearSession } = await import("./session");
    await clearSession();

    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });
});

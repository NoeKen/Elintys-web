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

describe("authService.refreshSession", () => {
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

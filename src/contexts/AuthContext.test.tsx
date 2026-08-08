import { act, render, screen } from "@testing-library/react";
import { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, AuthProvider } from "./AuthContext";
import { authService } from "@/features/auth/client/auth.service";
import type { AuthSession, User } from "@/shared/types";

vi.mock("@/features/auth/client/auth.service", () => ({
  authService: {
    refreshSession: vi.fn(),
    logout: vi.fn(),
  },
}));

const buildUser = (): User => ({
  id: "user-1",
  email: "test@elintys.com",
  firstName: "Ana",
  lastName: "Test",
  roles: ["participant"],
  subscriptions: [],
  referralBalance: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  isEmailVerified: true,
  onboardingCompleted: true,
  onboardingByRole: {},
  onboardingData: {},
});

function Consumer() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext manquant");
  return (
    <div>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
      <button onClick={() => ctx.login({ user: buildUser() } as AuthSession)}>
        login
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.mocked(authService.refreshSession).mockReset();
  });

  it("ne doit pas écraser une session posée par login() lorsque le refreshSession de montage résout après coup", async () => {
    let rejectRefresh!: (error: unknown) => void;
    vi.mocked(authService.refreshSession).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRefresh = reject;
      })
    );

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // L'utilisateur se connecte pendant que le refreshSession de montage
    // est toujours en vol (scénario de la race condition).
    await act(async () => {
      screen.getByText("login").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");

    // Le refreshSession de montage, lancé avant la connexion, résout enfin en échec.
    await act(async () => {
      rejectRefresh(new Error("session absente"));
      await Promise.resolve();
    });

    // La session posée manuellement ne doit pas être écrasée par la résolution tardive.
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("loading").textContent).toBe("false");
  });
});

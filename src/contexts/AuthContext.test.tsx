import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, AuthProvider } from "./AuthContext";
import { authService } from "@/features/auth/client/auth.service";
import { ApiClientError } from "@/shared/lib/api";
import type { AuthSession, User } from "@/shared/types";

vi.mock("@/features/auth/client/auth.service", () => ({
  authService: {
    restoreSession: vi.fn(),
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
      <span data-testid="unavailable">{String(ctx.isSessionUnavailable)}</span>
      <button onClick={() => ctx.login({ user: buildUser() } as AuthSession)}>
        login
      </button>
      <button onClick={ctx.retrySession}>retry</button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.mocked(authService.restoreSession).mockReset();
  });

  it("établit la session lorsque /auth/me répond", async () => {
    vi.mocked(authService.restoreSession).mockResolvedValue({
      status: "authenticated",
      session: { user: buildUser() } as AuthSession,
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("authenticated").textContent).toBe("true")
    );
    expect(screen.getByTestId("unavailable").textContent).toBe("false");
  });

  it("traite un 401 comme une absence de session CONFIRMÉE", async () => {
    // Le client partagé a déjà tenté un rafraîchissement transparent avant de
    // remonter un 401 : l'absence est établie, la redirection est légitime.
    vi.mocked(authService.restoreSession).mockResolvedValue({ status: "anonymous" });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("unavailable").textContent).toBe("false");
  });

  it.each([
    ["500", new ApiClientError(500, {})],
    ["503", new ApiClientError(503, {})],
    ["429", new ApiClientError(429, {})],
    ["panne réseau", new TypeError("Failed to fetch")],
  ])("ne déconnecte PAS sur une erreur %s", async (_name, error) => {
    // Cœur du finding : toute erreur était convertie en `null`, donc en
    // absence de session, donc en redirection vers la connexion. Une panne
    // d'API devenait une déconnexion utilisateur.
    vi.mocked(authService.restoreSession).mockResolvedValue({
      status: "unavailable",
      error,
    });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("unavailable").textContent).toBe("true"));
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });

  it("permet un réessai à la demande après un échec transitoire", async () => {
    vi.mocked(authService.restoreSession)
      .mockResolvedValueOnce({ status: "unavailable", error: new ApiClientError(500, {}) })
      .mockResolvedValueOnce({
        status: "authenticated",
        session: { user: buildUser() } as AuthSession,
      });

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("unavailable").textContent).toBe("true"));

    await userEvent.click(screen.getByText("retry"));

    await waitFor(() =>
      expect(screen.getByTestId("authenticated").textContent).toBe("true")
    );
    expect(screen.getByTestId("unavailable").textContent).toBe("false");
  });

  it("ne réessaie JAMAIS tout seul : pas de boucle sur une API en difficulté", async () => {
    vi.mocked(authService.restoreSession).mockResolvedValue({
      status: "unavailable",
      error: new ApiClientError(503, {}),
    });

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("unavailable").textContent).toBe("true"));

    // Un réessai automatique répété aggraverait la panne et déclencherait le
    // rate-limit : la relance est explicitement à la demande.
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(authService.restoreSession).toHaveBeenCalledTimes(1);
  });

  it("ne doit pas écraser une session posée par login() lorsque la restauration de montage résout après coup", async () => {
    let resolveRestore!: (value: { status: "anonymous" }) => void;
    vi.mocked(authService.restoreSession).mockReturnValue(
      new Promise((resolve) => {
        resolveRestore = resolve as typeof resolveRestore;
      })
    );

    renderProvider();

    // L'utilisateur se connecte pendant que la restauration de montage est
    // toujours en vol (scénario de la race condition).
    await act(async () => {
      screen.getByText("login").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");

    await act(async () => {
      resolveRestore({ status: "anonymous" });
      await Promise.resolve();
    });

    // La session posée manuellement ne doit pas être écrasée par la résolution tardive.
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("loading").textContent).toBe("false");
  });
});

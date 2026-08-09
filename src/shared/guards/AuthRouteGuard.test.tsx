import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRouteGuard } from "./AuthRouteGuard";
import type { User } from "@/shared/types";

const { replace, navigation, authState } = vi.hoisted(() => ({
  replace: vi.fn(),
  navigation: { pathname: "/connexion" },
  authState: {
    isAuthenticated: false,
    isLoading: false,
    user: null as User | null,
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace }),
}));

vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

const user: User = {
  id: "user-1",
  email: "test@elintys.com",
  firstName: "Ana",
  lastName: "Test",
  roles: ["organisateur"],
  subscriptions: [],
  referralBalance: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  isEmailVerified: true,
  onboardingCompleted: true,
  onboardingByRole: {},
  onboardingData: {},
};

describe("AuthRouteGuard", () => {
  beforeEach(() => {
    replace.mockReset();
    navigation.pathname = "/connexion";
    authState.isAuthenticated = false;
    authState.isLoading = false;
    authState.user = null;
    window.history.replaceState({}, "", "/connexion");
  });

  it("laisse un visiteur afficher une page de connexion", () => {
    render(
      <AuthRouteGuard>
        <p>Connexion</p>
      </AuthRouteGuard>,
    );

    expect(screen.getByText("Connexion")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirige un utilisateur connecté hors des pages invité", async () => {
    authState.isAuthenticated = true;
    authState.user = user;

    render(
      <AuthRouteGuard>
        <p>Connexion</p>
      </AuthRouteGuard>,
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/tableau-de-bord"),
    );
    expect(screen.queryByText("Connexion")).not.toBeInTheDocument();
  });

  it("redirige un visiteur anonyme depuis l'onboarding", async () => {
    navigation.pathname = "/onboarding/organisateur";
    window.history.replaceState(
      {},
      "",
      "/onboarding/organisateur?etape=2",
    );

    render(
      <AuthRouteGuard>
        <p>Onboarding</p>
      </AuthRouteGuard>,
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/connexion?redirect=%2Fonboarding%2Forganisateur%3Fetape%3D2",
      ),
    );
    expect(screen.queryByText("Onboarding")).not.toBeInTheDocument();
  });

  it("laisse l'onboarding visible avec une session restaurée", () => {
    navigation.pathname = "/onboarding/organisateur";
    authState.isAuthenticated = true;
    authState.user = { ...user, onboardingCompleted: false };

    render(
      <AuthRouteGuard>
        <p>Onboarding</p>
      </AuthRouteGuard>,
    );

    expect(screen.getByText("Onboarding")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

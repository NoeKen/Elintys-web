import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const pushMock = vi.fn();
const loginMock = vi.fn();
const authServiceLoginMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => ({ login: loginMock }),
}));

vi.mock("../client/auth.service", () => ({
  authService: {
    login: (...args: unknown[]) => authServiceLoginMock(...args),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  render(<LoginForm />);
  return {
    user,
    submit: async () => {
      await user.type(screen.getByPlaceholderText("nom@exemple.com"), email);
      await user.type(screen.getByPlaceholderText("••••••••"), password);
      await user.click(screen.getByRole("button", { name: /se connecter/i }));
    },
  };
}

describe("LoginForm", () => {
  it("affiche les champs email et mot de passe", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("nom@exemple.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("affiche une erreur de validation si l'email est invalide", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByPlaceholderText("nom@exemple.com"), "not-an-email");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(await screen.findByText("Adresse email invalide")).toBeInTheDocument();
    expect(authServiceLoginMock).not.toHaveBeenCalled();
  });

  it("connecte l'utilisateur et redirige vers le post-auth path par défaut", async () => {
    const session = {
      user: {
        id: "u1",
        email: "user@example.com",
        firstName: "Jane",
        lastName: "Doe",
        roles: ["participant"],
        subscriptions: [],
        referralBalance: 0,
        createdAt: "",
        updatedAt: "",
        isEmailVerified: true,
        onboardingCompleted: true,
        onboardingByRole: {},
        onboardingData: {},
      },
    };
    authServiceLoginMock.mockResolvedValue(session);

    const { submit } = fillAndSubmit("user@example.com", "password123");
    await submit();

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith(session));
    expect(pushMock).toHaveBeenCalledWith("/tableau-de-bord");
  });

  it("affiche un message d'erreur spécifique pour des identifiants invalides", async () => {
    authServiceLoginMock.mockRejectedValue({ code: "INVALID_CREDENTIALS" });

    const { submit } = fillAndSubmit("user@example.com", "wrongpass");
    await submit();

    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("affiche un message d'erreur générique pour une erreur inconnue", async () => {
    authServiceLoginMock.mockRejectedValue({ code: "SERVER_ERROR" });

    const { submit } = fillAndSubmit("user@example.com", "password123");
    await submit();

    expect(
      await screen.findByText("Une erreur est survenue. Veuillez réessayer."),
    ).toBeInTheDocument();
  });
});

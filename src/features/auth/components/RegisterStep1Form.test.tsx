import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RegisterStep1Form } from "./RegisterStep1Form";

async function fillValidForm(user: ReturnType<typeof userEvent.setup>, overrides?: {
  email?: string;
  password?: string;
  confirmPassword?: string;
  skipTerms?: boolean;
}) {
  await user.type(
    screen.getByLabelText("ADRESSE E-MAIL"),
    overrides?.email ?? "user@example.com",
  );
  await user.type(
    screen.getByLabelText("MOT DE PASSE"),
    overrides?.password ?? "Sup3rSecret",
  );
  await user.type(
    screen.getByLabelText("CONFIRMER LE MOT DE PASSE"),
    overrides?.confirmPassword ?? "Sup3rSecret",
  );
  if (!overrides?.skipTerms) {
    await user.click(screen.getByLabelText(/j'accepte les/i));
  }
}

describe("RegisterStep1Form", () => {
  it("affiche les champs de l'étape 1", () => {
    render(<RegisterStep1Form onSuccess={vi.fn()} />);
    expect(screen.getByLabelText("ADRESSE E-MAIL")).toBeInTheDocument();
    expect(screen.getByText("MOT DE PASSE")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMER LE MOT DE PASSE")).toBeInTheDocument();
  });

  it("pré-remplit l'email si initialEmail est fourni", () => {
    render(<RegisterStep1Form onSuccess={vi.fn()} initialEmail="prefill@example.com" />);
    expect(screen.getByLabelText("ADRESSE E-MAIL")).toHaveValue("prefill@example.com");
  });

  it("affiche l'erreur emailTakenError", () => {
    render(<RegisterStep1Form onSuccess={vi.fn()} emailTakenError="Cet email est déjà utilisé." />);
    expect(screen.getAllByText("Cet email est déjà utilisé.").length).toBeGreaterThan(0);
  });

  it("appelle onSuccess avec email et password si le formulaire est valide", async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<RegisterStep1Form onSuccess={onSuccess} />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /continuer/i }));

    expect(onSuccess).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Sup3rSecret",
    });
  });

  it("n'appelle pas onSuccess si les conditions ne sont pas acceptées", async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<RegisterStep1Form onSuccess={onSuccess} />);

    await fillValidForm(user, { skipTerms: true });
    await user.click(screen.getByRole("button", { name: /continuer/i }));

    expect(await screen.findByText("Vous devez accepter les conditions")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("affiche une erreur si les mots de passe ne correspondent pas", async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<RegisterStep1Form onSuccess={onSuccess} />);

    await fillValidForm(user, { confirmPassword: "Different1" });
    await user.click(screen.getByRole("button", { name: /continuer/i }));

    expect(
      await screen.findByText("Les mots de passe ne correspondent pas."),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le mot de passe manque une majuscule", async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<RegisterStep1Form onSuccess={onSuccess} />);

    await fillValidForm(user, { password: "lowercase1", confirmPassword: "lowercase1" });
    await user.click(screen.getByRole("button", { name: /continuer/i }));

    expect(await screen.findByText("Au moins une majuscule requise")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

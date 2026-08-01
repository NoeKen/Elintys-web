import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/shared/lib/api";
import { getUserFacingError } from "@/shared/lib/user-facing-error";

describe("getUserFacingError", () => {
  it("traduit une validation API sans exposer le chemin interne", () => {
    const result = getUserFacingError(
      new ApiClientError(
        400,
        { message: ["externalContact.email must be an email"] },
        "req-123",
      ),
    );

    expect(result).toEqual({
      message:
        "Courriel du prestataire : saisissez une adresse courriel valide.",
      details: [],
      requestId: "req-123",
    });
    expect(result.message).not.toContain("externalContact");
  });

  it("regroupe plusieurs champs invalides", () => {
    const result = getUserFacingError(
      new ApiClientError(400, {
        message: ["title should not be empty", "capacity must be a number"],
      }),
    );

    expect(result.message).toBe(
      "Plusieurs informations doivent être corrigées :",
    );
    expect(result.details).toEqual([
      "Titre de l’événement : ce champ est obligatoire.",
      "Capacité : saisissez un nombre valide.",
    ]);
  });

  it("explique une session expirée", () => {
    expect(getUserFacingError(new ApiClientError(401, {})).message).toContain(
      "session a expiré",
    );
  });

  it("distingue une erreur réseau", () => {
    expect(
      getUserFacingError(new TypeError("Failed to fetch")).message,
    ).toContain("Impossible de joindre");
  });

  it("n’affiche pas un message serveur non reconnu", () => {
    const result = getUserFacingError(
      new ApiClientError(400, {
        message: "Unexpected internal validator failure",
      }),
      { fallback: "Impossible d’enregistrer le formulaire." },
    );
    expect(result.message).toBe("Impossible d’enregistrer le formulaire.");
  });

  it("ignore une référence de requête non sûre", () => {
    const result = getUserFacingError(
      new ApiClientError(500, {}, "<script>alert(1)</script>"),
    );
    expect(result.requestId).toBeUndefined();
  });
});

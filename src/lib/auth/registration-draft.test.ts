import { afterEach, describe, expect, it } from "vitest";
import {
  clearRegistrationDraft,
  readRegistrationDraft,
  saveRegistrationDraft,
} from "./registration-draft";

const DRAFT_KEY = "elintys.registration.step1";

afterEach(() => {
  sessionStorage.clear();
});

describe("saveRegistrationDraft", () => {
  it("stocke les données dans sessionStorage sous la bonne clé", () => {
    saveRegistrationDraft({ email: "user@example.com", password: "Sup3rSecret!" });
    expect(sessionStorage.getItem(DRAFT_KEY)).toBe(
      JSON.stringify({ email: "user@example.com", password: "Sup3rSecret!" }),
    );
  });
});

describe("readRegistrationDraft", () => {
  it("retourne null si aucun brouillon n'est stocké", () => {
    expect(readRegistrationDraft()).toBeNull();
  });

  it("retourne le brouillon si email et password sont présents", () => {
    saveRegistrationDraft({ email: "user@example.com", password: "Sup3rSecret!" });
    expect(readRegistrationDraft()).toEqual({
      email: "user@example.com",
      password: "Sup3rSecret!",
    });
  });

  it("retourne null si le JSON stocké est invalide", () => {
    sessionStorage.setItem(DRAFT_KEY, "{not-json");
    expect(readRegistrationDraft()).toBeNull();
  });

  it("retourne null si email est manquant", () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ password: "Sup3rSecret!" }));
    expect(readRegistrationDraft()).toBeNull();
  });

  it("retourne null si password est manquant", () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ email: "user@example.com" }));
    expect(readRegistrationDraft()).toBeNull();
  });
});

describe("clearRegistrationDraft", () => {
  it("supprime le brouillon stocké", () => {
    saveRegistrationDraft({ email: "user@example.com", password: "Sup3rSecret!" });
    clearRegistrationDraft();
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});

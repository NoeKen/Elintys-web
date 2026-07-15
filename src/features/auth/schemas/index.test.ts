import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./index";

describe("loginSchema", () => {
  it("accepte un email et un mot de passe valides", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "Sup3rSecret!",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un email invalide", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "Sup3rSecret!" });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe trop court", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "short" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validPayload = {
    firstName: "Jane",
    lastName: "Doe",
    email: "user@example.com",
    password: "Sup3rSecret!",
    confirmPassword: "Sup3rSecret!",
  };

  it("accepte un payload complet et valide", () => {
    expect(registerSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejette un prénom vide", () => {
    const result = registerSchema.safeParse({ ...validPayload, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un nom vide", () => {
    const result = registerSchema.safeParse({ ...validPayload, lastName: "" });
    expect(result.success).toBe(false);
  });

  it("rejette si les mots de passe ne correspondent pas", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("accepte un email valide", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejette un email invalide", () => {
    expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const validPayload = {
    password: "Sup3rSecret!",
    confirmPassword: "Sup3rSecret!",
    token: "reset-token",
  };

  it("accepte un payload valide", () => {
    expect(resetPasswordSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejette si les mots de passe ne correspondent pas", () => {
    const result = resetPasswordSchema.safeParse({
      ...validPayload,
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });

  it("rejette un mot de passe trop court", () => {
    const result = resetPasswordSchema.safeParse({ ...validPayload, password: "short" });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate } from "./format";

describe("formatDate", () => {
  it("inclut la date et l'heure par défaut", () => {
    const result = formatDate("2026-06-15T18:00:00.000Z", {});
    expect(result).toContain("2026");
    expect(result).toContain("·");
  });

  it("exclut l'heure si time est false", () => {
    const result = formatDate("2026-06-15T18:00:00.000Z", { time: false });
    expect(result).not.toContain("·");
    expect(result).toContain("2026");
  });
});

describe("formatCurrency", () => {
  it("convertit les cents en dollars formatés", () => {
    expect(formatCurrency(7500)).toContain("75");
  });

  it("accepte une devise personnalisée", () => {
    const result = formatCurrency(10000, "USD");
    expect(result).toContain("100");
  });

  it("gère un montant de zéro", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
});

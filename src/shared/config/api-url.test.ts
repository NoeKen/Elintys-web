import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "./api-url";

describe("resolveApiUrl", () => {
  it("utilise l'URL injectée par l'environnement et retire les slashs finaux", () => {
    expect(
      resolveApiUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://elintys-api-dev.onrender.com/api/v1///",
      }),
    ).toBe("https://elintys-api-dev.onrender.com/api/v1");
  });

  it("autorise un proxy relatif explicitement configuré", () => {
    expect(
      resolveApiUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "/api/",
      }),
    ).toBe("/api");
  });

  it("utilise l'API locale uniquement hors production", () => {
    expect(resolveApiUrl({ NODE_ENV: "development" })).toBe(
      "http://localhost:3001/api/v1",
    );
  });

  it("échoue explicitement si un déploiement n'a pas d'URL API", () => {
    expect(() => resolveApiUrl({ NODE_ENV: "production" })).toThrow(
      "NEXT_PUBLIC_API_URL est obligatoire",
    );
  });

  it("rejette les protocoles non HTTP", () => {
    expect(() =>
      resolveApiUrl({
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "javascript:alert(1)",
      }),
    ).toThrow("URL HTTP(S)");
  });
});

describe("resolveApiUrl — environnements déployés", () => {
  it("devrait refuser une API locale pour un déploiement uat", () => {
    expect(() =>
      resolveApiUrl({
        NODE_ENV: "production",
        ELINTYS_ENV: "uat",
        NEXT_PUBLIC_API_URL: "http://localhost:3001/api/v1",
      }),
    ).toThrow(/HTTPS publique/);
  });

  it("devrait refuser une API en clair pour la production", () => {
    expect(() =>
      resolveApiUrl({
        NODE_ENV: "production",
        ELINTYS_ENV: "prod",
        NEXT_PUBLIC_API_URL: "http://api.elintys.com/api/v1",
      }),
    ).toThrow(/HTTPS publique/);
  });

  it("devrait accepter une API HTTPS publique ou un proxy relatif en uat", () => {
    expect(
      resolveApiUrl({
        NODE_ENV: "production",
        ELINTYS_ENV: "uat",
        NEXT_PUBLIC_API_URL: "https://elintys-api-uat.onrender.com/api/v1",
      }),
    ).toBe("https://elintys-api-uat.onrender.com/api/v1");
    expect(
      resolveApiUrl({ NODE_ENV: "production", ELINTYS_ENV: "dev", NEXT_PUBLIC_API_URL: "/api" }),
    ).toBe("/api");
  });

  it("devrait laisser la CI viser une API factice locale", () => {
    expect(
      resolveApiUrl({
        NODE_ENV: "production",
        ELINTYS_ENV: "ci",
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:3999/api/v1",
      }),
    ).toBe("http://127.0.0.1:3999/api/v1");
  });
});

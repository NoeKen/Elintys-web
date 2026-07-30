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

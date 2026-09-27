import {
  isDeployedEnvironment,
  resolveElintysEnvironment,
  type ElintysEnvironment,
} from "./environment";

const LOCAL_API_URL = "http://localhost:3001/api/v1";

export interface ApiEnvironment {
  NEXT_PUBLIC_API_URL?: string;
  NODE_ENV?: string;
  /** Environnement Elintys du build ; `dev`, `uat` et `prod` imposent une API HTTPS publique. */
  ELINTYS_ENV?: ElintysEnvironment;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

/**
 * Un déploiement (dev/uat/prod) ne doit jamais viser une API locale ni en
 * clair : l'erreur survient au build plutôt qu'en production, dans le
 * navigateur des utilisateurs.
 */
function assertDeployableApiUrl(url: string, environment: ElintysEnvironment): void {
  if (url.startsWith("/")) return;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL doit être une URL HTTPS publique pour l'environnement « ${environment} ».`,
    );
  }
}

function normalizeApiUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, "");

  if (!normalized) {
    throw new Error("NEXT_PUBLIC_API_URL ne peut pas être vide.");
  }

  if (!normalized.startsWith("/") && !/^https?:\/\//i.test(normalized)) {
    throw new Error(
      "NEXT_PUBLIC_API_URL doit être une URL HTTP(S) absolue ou un chemin relatif commençant par /.",
    );
  }

  return normalized;
}

export function resolveApiUrl(
  environment: ApiEnvironment = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV,
    ELINTYS_ENV: resolveElintysEnvironment(),
  },
): string {
  const configuredUrl = environment.NEXT_PUBLIC_API_URL;

  if (configuredUrl?.trim()) {
    const normalized = normalizeApiUrl(configuredUrl);
    if (environment.ELINTYS_ENV && isDeployedEnvironment(environment.ELINTYS_ENV)) {
      assertDeployableApiUrl(normalized, environment.ELINTYS_ENV);
    }
    return normalized;
  }

  if (environment.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL est obligatoire pour les builds Preview et Production.",
    );
  }

  return LOCAL_API_URL;
}

export const API_URL = resolveApiUrl();

const LOCAL_API_URL = "http://localhost:3001/api/v1";

export interface ApiEnvironment {
  NEXT_PUBLIC_API_URL?: string;
  NODE_ENV?: string;
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
  },
): string {
  const configuredUrl = environment.NEXT_PUBLIC_API_URL;

  if (configuredUrl?.trim()) {
    return normalizeApiUrl(configuredUrl);
  }

  if (environment.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL est obligatoire pour les builds Preview et Production.",
    );
  }

  return LOCAL_API_URL;
}

export const API_URL = resolveApiUrl();

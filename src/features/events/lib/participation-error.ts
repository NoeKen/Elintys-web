import { ApiClientError } from "@/shared/lib/api";
import { getUserFacingError, type UserFacingError } from "@/shared/lib/user-facing-error";
import frMessages from "../../../../messages/fr.json";

export const participationCopy = frMessages.participation;

function errorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiClientError)) return undefined;
  const payload = error.payload;
  if (!payload || typeof payload !== "object") return undefined;
  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

export function getParticipationError(error: unknown): UserFacingError {
  const code = errorCode(error);
  if (code && code in participationCopy.errors) {
    return {
      message: participationCopy.errors[code as keyof typeof participationCopy.errors],
      details: [],
      requestId: error instanceof ApiClientError ? error.requestId : undefined,
    };
  }
  return getUserFacingError(error, { fallback: participationCopy.genericError });
}

export function isParticipationConflict(error: unknown, code: string): boolean {
  return error instanceof ApiClientError && error.status === 409 && errorCode(error) === code;
}

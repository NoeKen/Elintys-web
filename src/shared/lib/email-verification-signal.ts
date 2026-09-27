/**
 * Signal global « courriel non vérifié ».
 *
 * L'API est l'autorité : toute mutation métier d'un utilisateur dont le
 * courriel n'est pas vérifié est refusée en HTTP 403 avec le code
 * `EMAIL_NOT_VERIFIED`. Le client partagé (`api.ts`) détecte cette réponse
 * UNE seule fois et émet ce signal ; l'interface (bandeau + dialogue) s'y
 * abonne. Aucune page n'a donc à gérer ce cas individuellement, et l'échec
 * n'est jamais silencieux.
 *
 * Module volontairement sans dépendance : `api.ts` l'importe, il ne doit pas
 * importer `api.ts` en retour.
 */
export const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";

type Listener = () => void;

const listeners = new Set<Listener>();

export function isEmailNotVerifiedPayload(status: number, payload: unknown): boolean {
  return (
    status === 403 &&
    Boolean(payload) &&
    typeof payload === "object" &&
    (payload as { code?: unknown }).code === EMAIL_NOT_VERIFIED_CODE
  );
}

export function onEmailNotVerified(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyEmailNotVerified(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Un abonné défaillant ne doit pas empêcher les autres d'être notifiés
      // ni masquer l'erreur HTTP d'origine levée par le client.
    }
  });
}

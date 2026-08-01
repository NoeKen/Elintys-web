import { ApiClientError } from "@/shared/lib/api";

export interface UserFacingError {
  message: string;
  details: string[];
  requestId?: string;
}

interface UserFacingErrorOptions {
  fallback?: string;
  fieldLabels?: Record<string, string>;
}

const DEFAULT_FALLBACK =
  "L’action n’a pas pu être effectuée. Vérifiez les informations saisies, puis réessayez.";

const FIELD_LABELS: Record<string, string> = {
  email: "Adresse courriel",
  "externalContact.email": "Courriel du prestataire",
  "externalContact.name": "Nom du prestataire",
  "externalContact.phone": "Téléphone du prestataire",
  password: "Mot de passe",
  newPassword: "Nouveau mot de passe",
  fullName: "Nom complet",
  firstName: "Prénom",
  lastName: "Nom",
  displayName: "Nom d’affichage",
  name: "Nom",
  title: "Titre de l’événement",
  description: "Description",
  startDate: "Date de début",
  endDate: "Date de fin",
  capacity: "Capacité",
  city: "Ville",
  postalCode: "Code postal",
  contactEmail: "Courriel de contact",
  contactPhone: "Téléphone de contact",
};

const STATUS_MESSAGES: Record<number, string> = {
  401: "Votre session a expiré ou n’est plus valide. Reconnectez-vous, puis réessayez.",
  403: "Vous n’avez pas l’autorisation nécessaire pour effectuer cette action.",
  404: "La ressource demandée est introuvable ou n’est plus disponible.",
  409: "Ces informations existent déjà ou entrent en conflit avec des données enregistrées.",
  413: "Le fichier sélectionné dépasse la taille autorisée.",
  429: "Trop de tentatives ont été effectuées. Patientez quelques instants avant de réessayer.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractMessages(payload: unknown): string[] {
  if (!isRecord(payload)) return [];
  const value = payload.message;
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function fieldLabel(field: string, overrides?: Record<string, string>): string {
  const normalized = field.replace(/\[(\d+)\]/g, ".$1");
  const withoutIndex = normalized.replace(/\.\d+(?=\.|$)/g, "");
  const leaf = withoutIndex.split(".").at(-1) ?? withoutIndex;
  return (
    overrides?.[field] ??
    overrides?.[withoutIndex] ??
    FIELD_LABELS[field] ??
    FIELD_LABELS[withoutIndex] ??
    FIELD_LABELS[leaf] ??
    "Champ concerné"
  );
}

function translateConstraint(constraint: string): string {
  const lower = constraint.toLowerCase().replace(/[.]$/, "");
  if (
    lower.includes("must be an email") ||
    lower.includes("must be a valid email")
  ) {
    return "saisissez une adresse courriel valide.";
  }
  if (
    lower.includes("should not be empty") ||
    lower.includes("must not be empty")
  ) {
    return "ce champ est obligatoire.";
  }
  if (lower.includes("must be a string")) return "saisissez du texte valide.";
  if (
    lower.includes("must be a number") ||
    lower.includes("must be an integer")
  ) {
    return "saisissez un nombre valide.";
  }
  if (lower.includes("must be a valid enum value")) {
    return "sélectionnez l’une des options proposées.";
  }
  if (lower.includes("must be a url"))
    return "saisissez une adresse web valide.";
  if (
    lower.includes("must be a uuid") ||
    lower.includes("must be a mongodb id")
  ) {
    return "la valeur sélectionnée n’est pas valide.";
  }
  if (lower.includes("must be longer than"))
    return "la valeur saisie est trop courte.";
  if (lower.includes("must be shorter than"))
    return "la valeur saisie est trop longue.";
  if (lower.includes("must be before") || lower.includes("must not be later")) {
    return "la date saisie n’est pas permise.";
  }
  return "la valeur saisie n’est pas valide.";
}

function validationDetail(
  rawMessage: string,
  fieldLabels?: Record<string, string>,
): string | undefined {
  const match = rawMessage.match(/^([A-Za-z_][A-Za-z0-9_.\[\]]*)\s+(.+)$/);
  if (!match) return undefined;
  const [, field, constraint] = match;
  const looksLikeConstraint = /^(must|should|is not|has to)/i.test(constraint);
  if (!looksLikeConstraint) return undefined;
  return `${fieldLabel(field, fieldLabels)} : ${translateConstraint(constraint)}`;
}

function requestIdFrom(error: unknown): string | undefined {
  const requestId =
    error instanceof ApiClientError
      ? error.requestId
      : isRecord(error) && typeof error.requestId === "string"
        ? error.requestId
        : undefined;
  return requestId && /^[A-Za-z0-9_-]{1,100}$/.test(requestId)
    ? requestId
    : undefined;
}

export function getUserFacingError(
  error: unknown,
  options: UserFacingErrorOptions = {},
): UserFacingError {
  const fallback = options.fallback ?? DEFAULT_FALLBACK;
  const requestId = requestIdFrom(error);

  if (error instanceof ApiClientError) {
    const details = extractMessages(error.payload)
      .map((message) => validationDetail(message, options.fieldLabels))
      .filter((message): message is string => Boolean(message));

    if (details.length === 1)
      return { message: details[0], details: [], requestId };
    if (details.length > 1) {
      return {
        message: "Plusieurs informations doivent être corrigées :",
        details,
        requestId,
      };
    }

    const message =
      STATUS_MESSAGES[error.status] ??
      (error.status >= 500
        ? "Le service est temporairement indisponible. Réessayez dans quelques instants."
        : fallback);
    return { message, details: [], requestId };
  }

  if (isRecord(error)) {
    if (error.code === "INVALID_CREDENTIALS") {
      return {
        message: "Adresse courriel ou mot de passe incorrect.",
        details: [],
        requestId,
      };
    }
    if (error.code === "EMAIL_TAKEN") {
      return {
        message: "Un compte utilise déjà cette adresse courriel.",
        details: [],
        requestId,
      };
    }
    if (error.code === "TOKEN_EXPIRED") {
      return {
        message:
          "Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.",
        details: [],
        requestId,
      };
    }
  }

  if (error instanceof TypeError) {
    return {
      message:
        "Impossible de joindre le service Elintys. Vérifiez votre connexion, puis réessayez.",
      details: [],
    };
  }

  return { message: fallback, details: [], requestId };
}

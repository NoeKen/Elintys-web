import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAMES } from "./server/auth/cookies";

// ⚠️ Next 16 : la convention de middleware s'appelle désormais `proxy` et doit
// se trouver AU NIVEAU DE CONVENTION (racine du dossier contenant `app/`).
// Comme l'application vit dans `src/app`, ce fichier DOIT être `src/proxy.ts`.
// Un `proxy.ts` à la racine du dépôt n'est PAS scanné par le build (F-001).

// Routes qui nécessitent une session active
// ⚠️ Ne pas inclure /evenements, /prestataires, /lieux — zone publique accessible sans compte
const PROTECTED_PREFIXES = [
  "/tableau-de-bord",
  "/dashboard",
  "/organisateur",
  "/prestataire",
  "/gestionnaire",
  "/onboarding",
  "/invites",
  "/billetterie",
  "/favoris",
  "/messages",
  "/parametres",
  "/profil",
  "/scan",
  "/admin",
];

// Routes accessibles uniquement aux visiteurs non connectés
const AUTH_ONLY_PREFIXES = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
];

/**
 * N'autorise qu'un chemin de retour interne (same-origin) pour éviter tout
 * open redirect. Un chemin valide commence par un seul "/" et n'est ni "//..."
 * ni "/\..." (qui seraient interprétés comme une URL absolue par le navigateur).
 */
function safeReturnPath(pathname: string, search: string): string {
  const candidate = `${pathname}${search}`;
  const isInternal =
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith("/\\");
  return isInternal ? candidate : "/tableau-de-bord";
}

/**
 * Correspondance par SEGMENT de chemin : `/prestataire` protège `/prestataire`
 * et `/prestataire/...` mais PAS le catalogue public `/prestataires`.
 */
function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Source de vérité : cookies httpOnly posés par NestJS.
  const hasSession =
    request.cookies.has(COOKIE_NAMES.ACCESS_TOKEN) ||
    request.cookies.has(COOKIE_NAMES.REFRESH_TOKEN);

  const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthOnly = matchesPrefix(pathname, AUTH_ONLY_PREFIXES);

  // Non connecté sur une route protégée → /connexion?redirect=<url interne>
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    url.searchParams.set(
      "redirect",
      safeReturnPath(pathname, request.nextUrl.search),
    );
    return NextResponse.redirect(url);
  }

  // Déjà connecté sur une page auth → /tableau-de-bord
  if (isAuthOnly && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/tableau-de-bord";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclure fichiers statiques, images Next.js et routes API internes
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAMES } from "./src/server/auth/cookies";

// Routes qui nécessitent une session active
// ⚠️ Ne pas inclure /evenements, /prestataires, /lieux — zone publique accessible sans compte
const PROTECTED_PREFIXES = [
  "/tableau-de-bord",
  "/dashboard",
  "/onboarding",
  "/invites",
  "/billetterie",
  "/favoris",
  "/messages",
  "/parametres",
  "/profil",
  "/admin",
];

// Routes accessibles uniquement aux visiteurs non connectés
const AUTH_ONLY_PREFIXES = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Source de vérité : cookies httpOnly posés par NestJS.
  const hasSession =
    request.cookies.has(COOKIE_NAMES.ACCESS_TOKEN) ||
    request.cookies.has(COOKIE_NAMES.REFRESH_TOKEN);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  // Non connecté sur une route protégée → /connexion?redirect=<url>
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
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

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function request(path: string, cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
}

function isNext(response: ReturnType<typeof proxy>): boolean {
  return response.headers.get("x-middleware-next") === "1";
}

describe("proxy (protection des routes)", () => {
  it("devrait rediriger un utilisateur anonyme depuis une route protégée vers /connexion", () => {
    const res = proxy(request("/tableau-de-bord"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/connexion");
    expect(location).toContain("redirect=%2Ftableau-de-bord");
  });

  it("devrait protéger les dashboards de rôle top-level (organisateur, prestataire, gestionnaire, scan)", () => {
    for (const path of ["/organisateur", "/prestataire", "/gestionnaire", "/scan/abc"]) {
      const res = proxy(request(path));
      expect(res.status, `${path} doit rediriger`).toBe(307);
    }
  });

  it("devrait laisser passer un utilisateur authentifié (cookie access_token) sur une route protégée", () => {
    const res = proxy(request("/tableau-de-bord", "access_token=abc"));
    expect(isNext(res)).toBe(true);
  });

  it("devrait rediriger si la session est expirée (aucun cookie de session)", () => {
    const res = proxy(request("/parametres", "theme=dark"));
    expect(res.status).toBe(307);
  });

  it("ne devrait PAS rediriger les routes publiques", () => {
    for (const path of ["/", "/evenements", "/lieux"]) {
      expect(isNext(proxy(request(path))), `${path} public`).toBe(true);
    }
  });

  it("ne devrait PAS confondre le catalogue public /prestataires avec le dashboard /prestataire", () => {
    expect(isNext(proxy(request("/prestataires")))).toBe(true); // public
    expect(proxy(request("/prestataire")).status).toBe(307); // protégé
  });

  it("devrait rediriger un utilisateur déjà connecté hors des pages auth-only vers /tableau-de-bord", () => {
    const res = proxy(request("/connexion", "refresh_token=xyz"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location") ?? "").toContain("/tableau-de-bord");
  });

  it("devrait accepter un cookie refresh_token seul comme session valide", () => {
    expect(isNext(proxy(request("/tableau-de-bord", "refresh_token=xyz")))).toBe(true);
  });

  it("devrait conserver un chemin de retour interne (pas d'open redirect)", () => {
    const location = proxy(request("/invites?x=1")).headers.get("location") ?? "";
    // le paramètre redirect est encodé et reste interne (commence par %2F = "/")
    expect(location).toContain("redirect=%2Finvites");
    expect(location).not.toContain("redirect=%2F%2F"); // pas de //
  });
});

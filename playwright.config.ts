import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Le projet `setup` s'exécute AVANT les projets fonctionnels et régénère les
 * états de session.
 *
 * Sans cette dépendance, `auth.setup.ts` n'était jamais exécuté : le
 * `testMatch` par défaut de Playwright ne retient que `*.spec.ts` / `*.test.ts`.
 * Les specs authentifiées reposaient donc sur des fichiers `.e2e/*.json`
 * laissés sur disque par une exécution manuelle antérieure, dont le jeton
 * d'accès expire en 15 minutes. Leurs échecs devenaient indiscernables d'une
 * vraie régression.
 *
 * Les états sont écrits dans `.e2e/`, ignoré par Git : aucun secret n'est
 * versionné, et chaque exécution repart d'une session fraîche.
 */
const OWNER_STATE = path.join(".e2e", "owner.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      // Scopé au dossier fonctionnel : `e2e/visual/auth.setup.ts` appartient à
      // playwright.visual.config.ts et a ses propres prérequis.
      testMatch: /functional\/auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        // Session par défaut des specs authentifiées. Les specs qui veulent un
        // visiteur anonyme le déclarent explicitement (`test.use`) ou créent
        // leur propre contexte.
        storageState: OWNER_STATE,
      },
    },
  ],
  webServer: {
    // Les devtools TanStack posent un bouton flottant en bas à droite qui
    // recouvre la barre de navigation mobile sous 400 px : sans cela, les
    // actions de l'application y sont inatteignables au clic.
    command: "npm run dev",
    env: { NEXT_PUBLIC_DISABLE_DEVTOOLS: "true" },
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

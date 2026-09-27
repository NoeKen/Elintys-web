import { defineConfig, devices } from '@playwright/test';

/**
 * Batterie E2E **smoke** — exécutée sur chaque pull request.
 *
 * Aucune API réelle, aucune base, aucun secret : le frontend est servi en
 * build de production (`next start`) et branché sur une API factice locale
 * (`e2e/smoke/stub-api.mjs`) qui répond comme pour un visiteur anonyme. Les
 * specs qui ont besoin d'un autre contrat l'imposent avec `page.route()`.
 *
 * La batterie fonctionnelle complète (API NestJS + MongoDB, comptes QA
 * provisionnés) reste dans `playwright.functional.config.ts`.
 *
 * Le build doit viser la même API que la spec :
 *   NEXT_PUBLIC_API_URL=http://127.0.0.1:3999/api/v1 npm run build
 *   npm run test:e2e:smoke
 * En local, `SMOKE_WEB_COMMAND="npm run dev"` évite le build préalable.
 */
const webPort = 3000;
const stubPort = 3999;

export const SMOKE_API_URL = `http://127.0.0.1:${stubPort}/api/v1`;

export default defineConfig({
  testDir: './e2e',
  // `landing.spec.ts` n'est pas repris ici : il suppose la session QA
  // connectée de `playwright.config.ts`. Sa variante anonyme vit dans
  // `e2e/smoke/public-pages.spec.ts`.
  testMatch: ['paypal-payment-pages.spec.ts', 'smoke/**/*.spec.ts'],
  outputDir: 'test-results/smoke',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Aucun réessai : un smoke qui ne passe qu'au second essai est un flaky à
  // corriger, pas à masquer.
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/smoke', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-CA',
    timezoneId: 'America/Toronto',
  },
  projects: [{ name: 'smoke-chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/smoke/stub-api.mjs',
      url: `http://127.0.0.1:${stubPort}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        STUB_API_PORT: String(stubPort),
        STUB_API_ALLOWED_ORIGIN: `http://localhost:${webPort}`,
      },
    },
    {
      command: process.env.SMOKE_WEB_COMMAND ?? `npx next start -p ${webPort}`,
      url: `http://localhost:${webPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_API_URL: SMOKE_API_URL,
        NEXT_PUBLIC_APP_URL: `http://localhost:${webPort}`,
        NEXT_PUBLIC_DISABLE_DEVTOOLS: 'true',
      },
    },
  ],
});

import { expect, test } from '@playwright/test';

/**
 * Pages publiques — visiteur ANONYME, API factice.
 *
 * `e2e/landing.spec.ts` vérifie la landing avec la session QA par défaut de
 * `playwright.config.ts` (utilisateur connecté). Ici le visiteur est anonyme :
 * la restauration de session (`GET /auth/me` puis `POST /auth/refresh`)
 * répond 401, ce que Chromium journalise comme « Failed to load resource ».
 * Ces deux réponses sont le contrat normal d'un visiteur anonyme ; toute
 * autre erreur console ou réponse en échec fait échouer la spec.
 */
const EXPECTED_ANONYMOUS_PROBES = [/\/api\/v1\/auth\/me$/, /\/api\/v1\/auth\/refresh$/];

test('devrait charger la landing sans erreur inattendue pour un visiteur anonyme', async ({ page }) => {
  const failedResponses: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('response', (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    if (response.status() === 401 && EXPECTED_ANONYMOUS_PROBES.some((probe) => probe.test(url))) return;
    failedResponses.push(`${response.status()} ${url}`);
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    // Les échecs réseau sont évalués ci-dessus, URL par URL.
    if (message.text().startsWith('Failed to load resource')) return;
    consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  expect(failedResponses).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

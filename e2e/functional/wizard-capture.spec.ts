import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { ApiClient, apiFromState, cleanupEvents, OWNER_STATE } from './helpers';
import { primaryAction, reachIdentityStep, reachReviewStep } from './wizard-journey';

/**
 * Capture des implémentations du wizard pour la QA visuelle Stitch.
 *
 * Ce fichier ne teste rien : il produit les captures comparées aux maquettes
 * dans `docs/design-qa/event-wizard-sprint-2/`. Il est donc désactivé par
 * défaut et ne rallonge pas la CI.
 *
 * Exécution : `WIZARD_QA_CAPTURE=1 npm run test:e2e:functional -- wizard-capture`
 *
 * La pile locale est utilisée volontairement : le harnais `playwright.visual`
 * s'authentifie contre l'API dev déployée, dont le cookie de session ne
 * s'installe pas sur `localhost`, ce qui rend ses parcours authentifiés
 * inexploitables.
 */

const OUTPUT_DIR = path.resolve('docs/design-qa/event-wizard-sprint-2/implementations');

let api: ApiClient;
const created: string[] = [];

test.skip(
  !process.env.WIZARD_QA_CAPTURE,
  'Capture de QA visuelle — activer avec WIZARD_QA_CAPTURE=1.',
);

test.beforeAll(async () => {
  api = await apiFromState(OWNER_STATE);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
});

test.afterAll(async () => {
  await cleanupEvents(api, created);
  await api.dispose();
});

/** Fige animations et curseurs pour obtenir des captures reproductibles. */
async function stabilize(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: [
      '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}',
      // Outils de développement (indicateur Next.js, panneau TanStack Query) :
      // ils se superposent au pied de page et pollueraient la comparaison.
      'nextjs-portal,[data-nextjs-toast],#__next-build-watcher,.tsqd-parent-container{display:none!important}',
    ].join(''),
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
}

/** Capture une étape et vérifie l'absence de débordement horizontal. */
async function captureStep(page: Page, step: number, suffix: string): Promise<void> {
  await stabilize(page);
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    metrics.scrollWidth,
    `étape ${step} @ ${suffix} : débordement horizontal`,
  ).toBeLessThanOrEqual(metrics.innerWidth + 1);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, `wizard-etape${step}-${suffix}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

for (const viewport of [
  { width: 1538, height: 1100 },
  { width: 390, height: 844 },
] as const) {
  const suffix = `${viewport.width}x${viewport.height}`;

  test(`capture les six étapes du wizard en ${suffix}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);

    const eventId = await reachIdentityStep(page, `[E2E] QA visuelle ${suffix}`, (step) =>
      captureStep(page, step, suffix),
    );
    created.push(eventId);

    await reachReviewStep(page);
    await captureStep(page, 6, suffix);

    // Le parcours reste terminable après la capture.
    await expect(primaryAction(page)).toBeEnabled();
  });
}

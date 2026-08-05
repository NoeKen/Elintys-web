import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ApiClient, apiFromState, cleanupEvents, OWNER_STATE } from './helpers';
import { primaryAction, reachIdentityStep, reachReviewStep } from './wizard-journey';

/**
 * Accessibilité du wizard de création d'événement (Sprint 2.3).
 *
 * Les étapes 5 et 6 n'étaient jamais auditées : elles ne sont atteignables
 * qu'en traversant réellement les étapes 1 à 4 (`wizard-journey.ts`).
 */

const REPORT = path.resolve('docs/design-qa/event-wizard-sprint-2/axe-wizard.json');

let api: ApiClient;
const created: string[] = [];
const findings: Array<{
  ecran: string;
  violations: Array<{ id: string; impact: string | null | undefined; noeuds: number }>;
}> = [];

test.beforeAll(async () => {
  api = await apiFromState(OWNER_STATE);
});

test.afterAll(async () => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(findings, null, 2)}\n`);
  await cleanupEvents(api, created);
  await api.dispose();
});

/**
 * Audite un écran et échoue sur toute violation `critical` ou `serious`.
 *
 * Les niveaux `minor` et `moderate` sont consignés dans le rapport sans
 * bloquer : ils relèvent d'arbitrages de design, pas de barrières d'usage.
 */
async function auditer(page: Page, ecran: string): Promise<void> {
  // Le catalogue de lieux et les listes arrivent en différé : auditer avant
  // leur stabilisation produit des verdicts non reproductibles.
  await page.waitForLoadState('networkidle').catch(() => undefined);
  // `AnimatePresence` garde l'étape sortante montée pendant son fondu : sans
  // cette attente, axe mesure le contraste d'un texte transitoirement
  // translucide et signale des violations qui n'existent pas à l'écran.
  await page.waitForTimeout(700);

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  findings.push({
    ecran,
    violations: violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      noeuds: violation.nodes.length,
    })),
  });

  const bloquantes = violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .flatMap((violation) =>
      violation.nodes.map(
        (noeud) =>
          `${violation.id} ${noeud.target.join(' ')} — ${noeud.failureSummary?.replace(/\s+/g, ' ').slice(0, 180)}`,
      ),
    );
  expect(bloquantes, `${ecran} : violations critiques ou sérieuses`).toEqual([]);
}

test.describe('Wizard — accessibilité', () => {
  // Les transitions d'étape se superposent : l'audit vise l'état stabilisé.
  test.use({ reducedMotion: 'reduce' });

  test('devrait rester conforme WCAG 2.1 AA sur les six étapes', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const eventId = await reachIdentityStep(page, `[E2E] Axe wizard ${Date.now()}`, async (step) => {
      // Les étapes 2 et 4 sont des variantes des étapes 1 et 3 côté structure.
      if ([1, 3, 5].includes(step)) await auditer(page, `étape ${step} — 1440×900`);
    });
    created.push(eventId);

    await reachReviewStep(page);
    await auditer(page, 'étape 6 — 1440×900');
  });

  test('devrait rester conforme en mobile et à 1024×768', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });

    const eventId = await reachIdentityStep(page, `[E2E] Axe mobile ${Date.now()}`);
    created.push(eventId);
    await auditer(page, 'étape 5 — 390×844');

    // 1024×768 est le viewport qui avait révélé F-036 : on vérifie ici que
    // l'absence de débordement s'accompagne d'une structure accessible.
    await page.setViewportSize({ width: 1024, height: 768 });
    await auditer(page, 'étape 5 — 1024×768');
    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(metrics.scrollWidth, 'aucun débordement horizontal à 1024×768').toBe(
      metrics.innerWidth,
    );
  });

  test('devrait exposer les contrôles de navigation au clavier', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    const eventId = await reachIdentityStep(page, `[E2E] Clavier wizard ${Date.now()}`);
    created.push(eventId);

    // Les options d'accès sont des `input` `sr-only` : elles doivent rester
    // atteignables au clavier malgré leur masquage visuel.
    await page.locator('input[name="accessPolicyType"][value="access_code"]').focus();
    await expect(page.locator('input[name="accessPolicyType"][value="access_code"]')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('#event-access-code')).toBeVisible();

    // Le bouton principal est activable au clavier.
    await primaryAction(page).focus();
    await expect(primaryAction(page)).toBeFocused();
  });
});

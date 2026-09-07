import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type { ApiClient } from './helpers';
import { apiContextFor, ownerCredentials, vendorCredentials, venueCredentials, waitForHydration } from './helpers';

/**
 * Accessibilité et responsive des écrans CORRIGÉS par la vague A.
 *
 * Ces écrans ont été réécrits (états d'erreur, mode création, sélecteurs
 * d'énumération, bouton favori) : leur conformité doit être vérifiée, pas
 * supposée.
 */
test.describe.configure({ mode: 'serial' });

const VIEWPORTS = [
  { nom: '320x720', width: 320, height: 720 },
  { nom: '390x844', width: 390, height: 844 },
  { nom: '768x1024', width: 768, height: 1024 },
  { nom: '1440x900', width: 1440, height: 900 },
] as const;

let owner: ApiClient;
let vendor: ApiClient;
let venue: ApiClient;

test.beforeAll(async () => {
  // La connexion peut attendre la fenêtre du rate-limit lors d'un démarrage
  // à froid : le hook doit pouvoir dépasser le délai par défaut.
  test.setTimeout(180_000);
  owner = await apiContextFor(ownerCredentials());
  vendor = await apiContextFor(vendorCredentials());
  venue = await apiContextFor(venueCredentials());
});

test.afterAll(async () => {
  await Promise.all([owner?.dispose(), vendor?.dispose(), venue?.dispose()]);
});

/** Échoue sur toute violation `critical` ou `serious`. */
async function auditer(page: Page, ecran: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const bloquantes = violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .flatMap((violation) =>
      violation.nodes.map(
        (noeud) =>
          `${violation.id} [${violation.impact}] ${noeud.target.join(' ')} — ${noeud.failureSummary?.replace(/\s+/g, ' ').slice(0, 180)}`,
      ),
    );

  expect(bloquantes, `${ecran} : violations critiques ou sérieuses`).toEqual([]);
}

test.describe('Vague A — accessibilité des écrans corrigés', () => {
  test('catalogues publics avec bouton favori branché', async ({ page }) => {
    for (const route of ['/prestataires', '/lieux', '/evenements']) {
      await page.goto(route);
      await waitForHydration(page);
      await auditer(page, route);
    }
  });

  test('écrans prestataire et gestionnaire', async ({ browser }) => {
    for (const [client, routes] of [
      [vendor, ['/tableau-de-bord/prestataire/profil', '/tableau-de-bord/prestataire/demandes']],
      [venue, ['/tableau-de-bord/gestionnaire/fiche', '/tableau-de-bord/gestionnaire/reservations']],
      [owner, ['/tableau-de-bord/favoris']],
    ] as const) {
      const context = await browser.newContext({ storageState: await client.storageState() });
      const page = await context.newPage();
      try {
        for (const route of routes) {
          await page.goto(route);
          await waitForHydration(page);
          await auditer(page, route);
        }
      } finally {
        await context.close();
      }
    }
  });
});

test.describe('Vague A — responsive des écrans corrigés', () => {
  for (const viewport of VIEWPORTS) {
    test(`aucun débordement horizontal à ${viewport.nom}`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: await vendor.storageState(),
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      try {
        for (const route of [
          '/prestataires',
          '/lieux',
          '/tableau-de-bord/prestataire/profil',
          '/tableau-de-bord/prestataire/demandes',
        ]) {
          await page.goto(route);
          await waitForHydration(page);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(overflow, `${route} à ${viewport.nom}`).toBeLessThanOrEqual(1);
        }
      } finally {
        await context.close();
      }
    });
  }

  test('les cibles tactiles des actions corrigées atteignent 44px', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: await vendor.storageState(),
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    try {
      await page.goto('/prestataires');
      await waitForHydration(page);
      const box = await page.getByTestId('favorite-button').first().boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);

      await page.goto('/tableau-de-bord/prestataire/profil');
      await waitForHydration(page);
      const submit = await page.getByTestId('vendor-profile-submit').boundingBox();
      expect(submit?.height ?? 0).toBeGreaterThanOrEqual(44);
    } finally {
      await context.close();
    }
  });
});

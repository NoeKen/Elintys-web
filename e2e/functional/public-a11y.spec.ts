import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibilité des pages publiques (Sprint 2.4).
 *
 * Deux défauts avaient été relevés puis corrigés : un `combobox` sans nom
 * accessible sur la landing (le rôle ARIA n'admet pas le nom calculé depuis le
 * contenu) et un contraste insuffisant sur les appels à l'action des cartes
 * d'événement. Ce test empêche leur réapparition.
 */

const PAGES = ['/', '/connexion', '/inscription', '/evenements', '/prestataires', '/lieux', '/tarification'];

const VIEWPORTS = [
  { nom: 'desktop', width: 1440, height: 900 },
  { nom: 'mobile', width: 390, height: 844 },
] as const;

/** Audite un écran et échoue sur toute violation `critical` ou `serious`. */
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

test.describe('Pages publiques — accessibilité', () => {
  for (const viewport of VIEWPORTS) {
    test(`devrait rester sans violation bloquante en ${viewport.nom}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of PAGES) {
        await page.goto(route, { waitUntil: 'load' });
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await auditer(page, `${route} — ${viewport.nom}`);
      }
    });
  }
});

test.describe('Landing — nom accessible du sélecteur de rôle', () => {
  test('devrait exposer le champ de rôle par son rôle et son nom', async ({ page }) => {
    await page.goto('/');
    // Le déclencheur Radix porte `role="combobox"` : sans `aria-label`, il est
    // annoncé sans nom, quel que soit le texte visible qu'il contient.
    const champ = page.getByRole('combobox', { name: 'Votre rôle' });
    await expect(champ).toBeVisible();

    await champ.focus();
    await expect(champ).toBeFocused();
  });
});

test.describe('Catalogue — contraste des appels à l’action', () => {
  test('devrait afficher les liens de carte sur un fond conforme AA', async ({ page }) => {
    await page.goto('/evenements');
    await page.waitForLoadState('networkidle').catch(() => undefined);

    const lien = page.getByTestId('event-card-link').first();
    await expect(lien).toBeVisible();

    // #2A6070 sur blanc : 7:1, au-delà du minimum de 4.5:1 exigé pour du
    // texte de 12 px. L'ancien fond `accent` (#4A8E9E) plafonnait à 3.71:1.
    const fond = await lien.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(fond).toBe('rgb(42, 96, 112)');
  });
});

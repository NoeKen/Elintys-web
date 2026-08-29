import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Pages de retour de paiement — accessibilité et honnêteté du discours.
 *
 * Ces pages sont publiques et ne dépendent d'aucune session : elles peuvent
 * donc être vérifiées sans API ni compte de test. Sans `order_id` valide,
 * elles affichent l'état « commande introuvable » et n'émettent aucune
 * requête réseau.
 */
const ROUTES = ['/paiement/succes', '/paiement/annule'] as const;

const VIEWPORTS = [
  { name: '320x720', width: 320, height: 720 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1538x1100', width: 1538, height: 1100 },
] as const;

test.describe('Pages de retour de paiement', () => {
  for (const route of ROUTES) {
    test(`${route} — aucune violation Axe critical/serious`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      );
      expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });

    test(`${route} — expose une région live et un titre unique`, async ({ page }) => {
      await page.goto(route);

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.locator('[aria-live="polite"]')).toHaveCount(1);
    });

    test(`${route} — navigable au clavier`, async ({ page }) => {
      await page.goto(route);
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test(`${route} — aucun débordement horizontal`, async ({ page }) => {
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `débordement à ${viewport.name}`).toBeLessThanOrEqual(1);
      }
    });

    test(`${route} — n'affirme jamais un résultat de paiement non vérifié`, async ({ page }) => {
      await page.goto(route);
      // Texte VISIBLE de la carte d'état, sans le chrome du site ni les
      // scripts injectés par le framework.
      const visible = await page.locator('section[aria-labelledby="payment-status-title"]').innerText();

      expect(visible).not.toMatch(/aucun montant.*débité/i);
      expect(visible).not.toMatch(/paiement confirmé/i);
      expect(visible).not.toMatch(/rembours/i);
    });

    test(`${route} — n'expose aucun identifiant technique au participant`, async ({ page }) => {
      await page.goto(route);
      const visible = await page.locator('section[aria-labelledby="payment-status-title"]').innerText();

      expect(visible).not.toMatch(/paypal/i);
      expect(visible).not.toMatch(/capture|idempotency|order[_ ]?id|hold|transaction/i);
    });
  }

  test('utilise le défilement natif du document', async ({ page }) => {
    await page.goto('/paiement/succes');
    const overflowY = await page.evaluate(
      () => getComputedStyle(document.documentElement).overflowY,
    );
    expect(['visible', 'auto', '']).toContain(overflowY);
  });
});

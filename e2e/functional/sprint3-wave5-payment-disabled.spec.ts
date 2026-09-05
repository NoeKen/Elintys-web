import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: '320x720', width: 320, height: 720 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1538x1100', width: 1538, height: 1100 },
] as const;

const FAIL_CLOSED_ROUTES = [
  { path: '/checkout/wave5-qa', heading: "L’achat en ligne n’est pas encore ouvert" },
  {
    path: '/paiement/succes?session_id=cs_secret_should_not_render',
    heading: 'Commande introuvable',
  },
  { path: '/paiement/annule', heading: 'Commande introuvable' },
] as const;

test.describe('Sprint 3 Vague 5 — paiement participant fail-closed', () => {
  for (const viewport of VIEWPORTS) {
    test(`reste honnête et sans overflow en ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);

      for (const route of FAIL_CLOSED_ROUTES) {
        await page.goto(route.path, { waitUntil: 'load' });
        await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
        await expect(page.getByText(/paiement confirmé|paiement annulé|aucun montant n.*a été débité/i)).toHaveCount(0);
        await expect(page.getByText('cs_secret_should_not_render')).toHaveCount(0);

        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          bodyOverflowY: getComputedStyle(document.body).overflowY,
        }));
        expect(layout.overflow).toBeLessThanOrEqual(1);
        expect(layout.bodyOverflowY).not.toBe('hidden');
      }
    });
  }

  test('reste sans violation Axe critical/serious', async ({ page }) => {
    for (const route of FAIL_CLOSED_ROUTES) {
      await page.goto(route.path, { waitUntil: 'load' });
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = result.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
      expect(blocking, `${route.path}: axe critical/serious`).toEqual([]);
    }
  });

  test('permet d’atteindre l’action principale au clavier avec un focus visible', async ({ page }) => {
    await page.goto('/paiement/succes', { waitUntil: 'load' });

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
      if (label === 'Voir mes billets') break;
    }

    const action = page.getByRole('link', { name: 'Voir mes billets' });
    await expect(action).toBeFocused();
    const focusStyle = await action.evaluate((element) => {
      const style = getComputedStyle(element);
      return `${style.outlineStyle}:${style.outlineWidth}:${style.boxShadow}`;
    });
    expect(focusStyle).not.toMatch(/^none:0px:none$/);
  });
});

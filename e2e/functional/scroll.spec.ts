import { expect, test } from '@playwright/test';
import { assertInternalScrollerIsScrollable, assertPageIsScrollable, assertTouchScroll } from './scroll.helpers';
import { waitForHydration } from './helpers';

test.describe('Phase 24B — scroll natif', () => {
  for (const route of ['/', '/evenements', '/prestataires', '/lieux', '/connexion', '/inscription']) {
    test(`document natif ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 720 });
      await page.goto(route);
      await waitForHydration(page);
      await assertPageIsScrollable(page);
    });
  }

  test('dashboard : un seul scroll container intentionnel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 720 });
    await page.goto('/tableau-de-bord');
    await waitForHydration(page);
    const scroller = page.locator('main.overflow-y-auto').first();
    await expect(scroller).toBeVisible();
    await assertInternalScrollerIsScrollable(scroller);
    expect(await page.evaluate(() => window.scrollY), 'le document ne doit pas doubler le scroll dashboard').toBe(0);
  });

  test('menu mobile : verrouillage temporaire puis restauration du body', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 720 });
    await page.goto('/evenements');
    await waitForHydration(page);
    const initialOverflow = await page.evaluate(() => document.body.style.overflow);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('.navbar-mobile-drawer')).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('.navbar-mobile-drawer')).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(initialOverflow);
  });

  test('geste tactile vertical sur une page publique', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: 'http://localhost:3000',
      viewport: { width: 390, height: 720 },
      hasTouch: true,
      isMobile: true,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto('/evenements');
    await waitForHydration(page);
    await assertTouchScroll(page);
    await context.close();
  });
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Browser } from '@playwright/test';
import type { ApiClient } from './helpers';
import {
  apiContextFor,
  hideDevtoolsOverlay,
  ownerCredentials,
  waitForHydration,
} from './helpers';

/**
 * Régression : le bouton menu de la barre supérieure était inerte.
 *
 * `<Topbar />` était rendu sans props, donc `onMenuClick` valait `undefined`.
 * Sous 768 px la barre latérale est masquée : l'utilisateur cliquait sur un
 * menu qui ne s'ouvrait jamais, et n'avait aucun retour visuel.
 */
test.describe.configure({ mode: 'serial' });

let owner: ApiClient;

test.beforeAll(async () => {
  test.setTimeout(180_000);
  owner = await apiContextFor(ownerCredentials());
});

test.afterAll(async () => {
  await owner?.dispose();
});

async function mobilePage(browser: Browser, width: number) {
  const context = await browser.newContext({
    storageState: await owner.storageState(),
    viewport: { width, height: 800 },
  });
  await hideDevtoolsOverlay(context);
  const page = await context.newPage();
  await page.goto('/tableau-de-bord');
  await waitForHydration(page);
  return { page, close: () => context.close() };
}

test.describe('Vague B — précondition : menu mobile', () => {
  for (const width of [320, 375, 390]) {
    test(`le bouton menu ouvre réellement la navigation à ${width}px`, async ({ browser }) => {
      const { page, close } = await mobilePage(browser, width);
      try {
        const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
        await expect(burger).toBeVisible();
        await expect(burger).toHaveAttribute('aria-expanded', 'false');

        const box = await burger.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);

        await burger.click();

        const menu = page.getByTestId('mobile-menu');
        await expect(menu).toBeVisible();
        // Radix masque les siblings du dialogue de l'arbre d'accessibilité
        // pendant l'ouverture. Le déclencheur reste dans le DOM et doit y
        // refléter l'état contrôlé.
        await expect(
          page.locator('button[aria-controls="mobile-dashboard-menu"]'),
        ).toHaveAttribute('aria-expanded', 'true');
        // Le tiroir doit réellement porter des destinations, pas être vide.
        expect(await menu.getByRole('link').count()).toBeGreaterThan(0);
      } finally {
        await close();
      }
    });
  }

  test('le menu se ferme à Escape et rend le focus', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, 390);
    try {
      const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
      await burger.click();
      await expect(page.getByTestId('mobile-menu')).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByTestId('mobile-menu')).toBeHidden();
      await expect(burger).toBeFocused();
    } finally {
      await close();
    }
  });

  test('le menu est navigable au clavier seul', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, 390);
    try {
      await page.getByRole('button', { name: 'Ouvrir le menu' }).press('Enter');

      const menu = page.getByTestId('mobile-menu');
      await expect(menu).toBeVisible();
      // Radix déplace le focus dans le dialogue : sans cela, la tabulation
      // continuerait derrière l'overlay.
      await expect(menu.locator(':focus')).toHaveCount(1);
    } finally {
      await close();
    }
  });

  test('une destination du menu navigue puis referme le tiroir', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, 390);
    try {
      await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
      const menu = page.getByTestId('mobile-menu');
      await menu.getByRole('link', { name: 'Mes favoris' }).click();

      await expect(page).toHaveURL(/\/tableau-de-bord\/favoris/);
      await expect(menu).toBeHidden();
    } finally {
      await close();
    }
  });

  test('le bouton menu reste masqué quand la barre latérale est visible', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, 1024);
    try {
      // À partir du point de rupture `md`, la barre latérale prend le relais :
      // exposer les deux serait une duplication.
      await expect(page.getByRole('button', { name: 'Ouvrir le menu' })).toBeHidden();
    } finally {
      await close();
    }
  });

  test('le tiroir ouvert reste sans violation Axe bloquante', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, 390);
    try {
      await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
      await expect(page.getByTestId('mobile-menu')).toBeVisible();

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      );

      expect(blocking.map((violation) => violation.id)).toEqual([]);
    } finally {
      await close();
    }
  });

  test('aucun débordement horizontal, tiroir ouvert', async ({ browser }) => {
    for (const width of [320, 375, 390, 768]) {
      const { page, close } = await mobilePage(browser, width);
      try {
        const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
        if (await burger.isVisible()) await burger.click();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `débordement à ${width}px`).toBeLessThanOrEqual(1);
      } finally {
        await close();
      }
    }
  });
});

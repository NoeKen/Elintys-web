import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import path from 'node:path';
import { waitForHydration } from './helpers';

const VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1538, height: 1100 },
] as const;

const EMPTY_STATE = { cookies: [], origins: [] };
const CARD_SELECTOR = [
  '[data-testid="event-card"]',
  '.vendor-card',
  '.venue-card',
  '.premium-card',
  '.card-elintys',
  '.ticket-card',
  '.public-event-fact',
  '.public-event-section',
  '.public-event-action-card',
  '.public-event-organizer',
  '.hero-proof-card',
  '[data-testid="organizer-events-header"]',
  '[data-testid="organizer-events-filters"]',
].join(',');

async function expectNoBlockingAxe(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  expect(blocking, `${label}: violations Axe critical/serious`).toEqual([]);
}

async function expectNoVisibleCardBorders(page: Page, label: string) {
  const cards = page.locator(CARD_SELECTOR);
  const count = await cards.count();
  expect(count, `${label}: aucune carte auditée trouvée`).toBeGreaterThan(0);
  const visibleBorders = await cards.evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = getComputedStyle(element);
        return element.getBoundingClientRect().width > 0 &&
          [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth]
            .some((width) => Number.parseFloat(width) > 0);
      })
      .map((element) => ({ className: element.className, text: element.textContent?.trim().slice(0, 80) })),
  );
  expect(visibleBorders, `${label}: contours de cards visibles`).toEqual([]);
}

test.describe('Wave D — vérité produit et cohérence visuelle', () => {
  test('la recherche future est annoncée honnêtement sans CTA factice', async ({ browser }) => {
    const context = await browser.newContext({ storageState: EMPTY_STATE });
    const page = await context.newPage();
    try {
      await page.goto('/evenements/recherche');
      await waitForHydration(page);
      await expect(page.getByText('Fonctionnalité à venir')).toBeVisible();
      await expect(page.getByText(/recherche avancée n’est pas encore disponible/i)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Parcourir le catalogue' })).toHaveAttribute('href', '/evenements');
      await expect(page.locator('a[href="#"]')).toHaveCount(0);
      await expectNoBlockingAxe(page, 'recherche future');
    } finally {
      await context.close();
    }
  });

  test('les routes organisateur ambiguës ne simulent plus un chargement infini', async ({ page }) => {
    for (const route of ['/organisateur/analytiques', '/organisateur/billetterie']) {
      await page.goto(route);
      await waitForHydration(page);
      await expect(page.getByText('Fonctionnalité à venir')).toBeVisible();
      await expect(page.locator('.animate-pulse')).toHaveCount(0);
      await expectNoBlockingAxe(page, route);
    }
  });

  test('les cards canoniques publiques n’ont aucun contour visible', async ({ browser }) => {
    const context = await browser.newContext({ storageState: EMPTY_STATE });
    const page = await context.newPage();
    try {
      for (const route of ['/evenements', '/prestataires', '/lieux']) {
        await page.goto(route);
        await waitForHydration(page);
        await expectNoVisibleCardBorders(page, route);
      }
    } finally {
      await context.close();
    }
  });

  test('les CTA Search, newsletter et réseaux non branchés ne prétendent plus fonctionner', async ({ browser }) => {
    const context = await browser.newContext({ storageState: EMPTY_STATE });
    const page = await context.newPage();
    try {
      await page.goto('/evenements');
      await waitForHydration(page);
      await expect(page.getByRole('textbox', { name: 'Rechercher un événement' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Explorer les événements' })).toHaveAttribute('href', '#events-catalog-title');
      await expect(page.getByText(/Aucune adresse n’est collectée/)).toBeVisible();
      await expect(page.getByRole('textbox', { name: /newsletter/i })).toHaveCount(0);
      await expect(page.getByRole('link', { name: /Instagram|TikTok|LinkedIn/ })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('les cards dashboard partagées n’ont aucun contour visible', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: 'Mes événements' })).toBeVisible({ timeout: 30_000 });
    await expectNoVisibleCardBorders(page, 'mes événements');
  });

  test('les pages publiques et dashboard restent fluides aux sept viewports', async ({ browser }) => {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport, storageState: EMPTY_STATE });
      const page = await context.newPage();
      try {
        for (const route of ['/evenements/recherche', '/evenements']) {
          await page.goto(route);
          await waitForHydration(page);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          expect(overflow, `${route} ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);
          expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
        }
      } finally {
        await context.close();
      }
    }
  });

  test('les surfaces représentatives restent sans erreur console ni réponse serveur inattendue', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkFailures: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 500) networkFailures.push(`${response.status()} ${response.url()}`);
    });

    for (const route of ['/evenements', '/prestataires', '/lieux', '/tableau-de-bord/evenements']) {
      await page.goto(route);
      await waitForHydration(page);
    }

    expect(consoleErrors).toEqual([]);
    expect(networkFailures).toEqual([]);
  });

  test('preuves visuelles minimales desktop et mobile', async ({ browser }) => {
    await capture(browser, { width: 1440, height: 900 }, 'search-1440.png');
    await capture(browser, { width: 390, height: 844 }, 'search-390.png');
  });
});

async function capture(browser: Browser, viewport: { width: number; height: number }, file: string) {
  const context = await browser.newContext({ viewport, storageState: EMPTY_STATE });
  const page = await context.newPage();
  try {
    await page.goto('/evenements/recherche');
    await waitForHydration(page);
    await page.screenshot({
      path: path.join('docs/design-qa/sprint-3-wave-d/implementations/after', file),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
}

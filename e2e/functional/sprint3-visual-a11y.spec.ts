import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  OWNER_STATE,
  apiFromState,
  cleanupEvents,
  createDraft,
  type ApiClient,
} from './helpers';

const QA_ROOT = path.resolve('docs/design-qa/sprint-3-wave-1');
const IMPLEMENTATIONS = path.join(QA_ROOT, 'implementations');
const AXE_REPORT = path.join(QA_ROOT, 'axe.json');
const VIEWPORTS = [
  { name: '320x720', width: 320, height: 720 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1538x1100', width: 1538, height: 1100 },
] as const;

interface AxeSurface {
  surface: string;
  viewport: string;
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];
}

const axeResults: AxeSurface[] = [];
const created: string[] = [];
const visualPrefix = `Sprint 3 visuel ${Date.now()}`;
let api: ApiClient;

async function stabilize(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('.premium-skeleton').first().waitFor({ state: 'detached', timeout: 15_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function capture(page: Page, name: string) {
  await stabilize(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${name}: débordement horizontal`).toBeLessThanOrEqual(1);
  await page.screenshot({ path: path.join(IMPLEMENTATIONS, `${name}.png`), fullPage: true, animations: 'disabled' });
}

async function audit(page: Page, testInfo: TestInfo, surface: string) {
  await stabilize(page);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  axeResults.push({
    surface,
    viewport: `${testInfo.project.use.viewport?.width ?? page.viewportSize()?.width}x${testInfo.project.use.viewport?.height ?? page.viewportSize()?.height}`,
    violations: result.violations,
  });
  const blocking = result.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
  expect(blocking, `${surface}: violations axe critical/serious`).toEqual([]);
}

async function openEvents(page: Page, mode: 'grid' | 'list' = 'grid') {
  await page.goto('/tableau-de-bord/evenements');
  await page.getByPlaceholder('Rechercher un événement…').fill(visualPrefix);
  await expect(page.locator('article').filter({ hasText: visualPrefix }).first()).toBeVisible();
  if (mode === 'list') {
    await page.getByRole('button', { name: 'Liste' }).click();
    await expect(page.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
  }
}

test.describe.serial('Sprint 3 Vague 1 — QA visuelle et accessibilité', () => {
  test.beforeAll(async () => {
    fs.mkdirSync(path.join(QA_ROOT, 'references'), { recursive: true });
    fs.mkdirSync(IMPLEMENTATIONS, { recursive: true });
    fs.mkdirSync(path.join(QA_ROOT, 'comparisons'), { recursive: true });
    api = await apiFromState(OWNER_STATE);
    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const fixtures = await Promise.all([
      createDraft(api, { title: `${visualPrefix} gala`, eventType: 'gala', creationProgress: { currentStep: 2, completedSteps: [1], skippedSteps: [] } }),
      createDraft(api, { title: `${visualPrefix} conférence`, eventType: 'conference', startDate: future, location: { type: 'physical', name: 'Maison Elintys', city: 'Montréal' }, discoverability: 'public', accessPolicy: { type: 'open' }, admissionModes: ['registration_only'], creationProgress: { currentStep: 6, completedSteps: [1, 2, 3, 4, 5, 6], skippedSteps: [] } }),
      createDraft(api, { title: `${visualPrefix} réseautage`, eventType: 'networking', startDate: future, location: { type: 'online', name: 'En ligne' }, discoverability: 'unlisted', accessPolicy: { type: 'registration_required' }, admissionModes: ['free_ticket'], creationProgress: { currentStep: 5, completedSteps: [1, 2, 3, 4], skippedSteps: [] } }),
    ]);
    created.push(...fixtures.map((fixture) => fixture.id));
  });

  test.afterAll(async () => {
    if (axeResults.length > 0) {
      fs.writeFileSync(AXE_REPORT, `${JSON.stringify({ generatedAt: new Date().toISOString(), surfaces: axeResults }, null, 2)}\n`);
    }
    await cleanupEvents(api, created);
    await api.dispose();
  });

  for (const viewport of VIEWPORTS) {
    test(`captures responsive ${viewport.name}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/tableau-de-bord');
      await expect(page.getByRole('heading', { name: /^Bonjour/ })).toBeVisible();
      await capture(page, `dashboard-${viewport.name}`);

      await openEvents(page);
      if (viewport.width <= 768) {
        await page.locator('article').filter({ hasText: visualPrefix }).first().scrollIntoViewIfNeeded();
      }
      await capture(page, `events-grid-${viewport.name}`);

      await page.getByRole('button', { name: 'Liste' }).click();
      if (viewport.width <= 768) {
        await page.locator('article').filter({ hasText: visualPrefix }).first().scrollIntoViewIfNeeded();
      }
      await capture(page, `events-list-${viewport.name}`);
    });
  }

  for (const surface of [
    { name: 'dashboard-desktop', width: 1440, height: 900, route: '/tableau-de-bord', mode: 'dashboard' },
    { name: 'dashboard-mobile', width: 390, height: 844, route: '/tableau-de-bord', mode: 'dashboard' },
    { name: 'events-grid-desktop', width: 1440, height: 900, route: '/tableau-de-bord/evenements', mode: 'grid' },
    { name: 'events-grid-mobile', width: 390, height: 844, route: '/tableau-de-bord/evenements', mode: 'grid' },
    { name: 'events-list-desktop', width: 1440, height: 900, route: '/tableau-de-bord/evenements', mode: 'list' },
    { name: 'events-list-mobile', width: 390, height: 844, route: '/tableau-de-bord/evenements', mode: 'list' },
  ] as const) {
    test(`axe ${surface.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: surface.width, height: surface.height });
      if (surface.mode === 'dashboard') await page.goto(surface.route);
      else await openEvents(page, surface.mode);
      await audit(page, testInfo, surface.name);
    });
  }

  test('axe et capture empty', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route('**/events/my?*', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0, page: 1, limit: 12 }),
    }));
    await page.goto('/tableau-de-bord/evenements');
    await expect(page.getByRole('heading', { name: 'Votre premier événement commence ici.' })).toBeVisible();
    await capture(page, 'events-empty-1440x900');
    await audit(page, testInfo, 'empty');
  });

  test('axe et capture error', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route('**/events/my?*', (route) => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'SERVICE_UNAVAILABLE', requestId: 'sprint-3-visual-error' }),
    }));
    await page.goto('/tableau-de-bord/evenements');
    await expect(page.getByRole('heading', { name: 'Impossible de charger vos événements' })).toBeVisible();
    await capture(page, 'events-error-1440x900');
    await audit(page, testInfo, 'error');
  });

  test('clavier, focus, menus, zoom, reduced motion et cibles tactiles', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 720, height: 900 });
    await openEvents(page);

    const allTab = page.getByRole('tab', { name: 'Tous' });
    await allTab.focus();
    await page.keyboard.press('ArrowRight');
    const draftTab = page.getByRole('tab', { name: 'Brouillons' });
    await expect(draftTab).toBeFocused();
    await expect(draftTab).toHaveAttribute('aria-selected', 'true');
    expect(await draftTab.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');

    const menuButton = page.getByRole('button', { name: /Plus d’actions pour .*Sprint 3 visuel/ }).first();
    await menuButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');

    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'reflow équivalent zoom 200 %').toBeLessThanOrEqual(1);

    const undersizedButtons = await page.locator('main button:visible').evaluateAll((buttons) => buttons
      .map((button) => {
        const rect = button.getBoundingClientRect();
        return { label: button.getAttribute('aria-label') ?? button.textContent?.trim() ?? '', width: rect.width, height: rect.height };
      })
      .filter((button) => button.width < 44 || button.height < 44));
    expect(undersizedButtons, 'boutons tactiles sous 44 px').toEqual([]);
  });
});

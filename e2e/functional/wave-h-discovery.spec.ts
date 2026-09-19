import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  OWNER_STATE,
  apiFromState,
  cleanupEvents,
  createDraft,
  type ApiClient,
} from './helpers';

let api: ApiClient;
const created: string[] = [];
const marker = `Discovery-${Date.now()}`;
let publicEvent: { id: string; title: string; slug: string };
let runtimeAudit: {
  consoleErrors: string[];
  pageErrors: string[];
  serverErrors: string[];
  unauthorizedResponses: string[];
};

const ANONYMOUS_AUTH_CONSOLE_ERROR = 'Failed to load resource: the server responded with a status of 401 (Unauthorized)';

function startRuntimeAudit(page: Page) {
  runtimeAudit = { consoleErrors: [], pageErrors: [], serverErrors: [], unauthorizedResponses: [] };
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text() !== ANONYMOUS_AUTH_CONSOLE_ERROR) {
      runtimeAudit.consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => runtimeAudit.pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500) runtimeAudit.serverErrors.push(`${response.status()} ${response.url()}`);
    if (response.status() === 401) runtimeAudit.unauthorizedResponses.push(response.url());
  });
}

async function createSearchEvent(kind: 'public' | 'unlisted' | 'private') {
  const draft = await createDraft(api, { title: `${marker}-${kind}` });
  created.push(draft.id);
  expect((await api.patch(`/events/${draft.id}`, {
    data: { eventType: 'gala', startDate: '2027-05-15T22:00:00.000Z' },
  })).status()).toBe(200);
  expect((await api.put(`/events/${draft.id}/access-configuration`, {
    data: {
      discoverability: kind,
      accessPolicy: kind === 'public' ? { type: 'open' } : { type: 'invitation_token' },
      admissionModes: kind === 'public' ? ['registration_only'] : ['invitation'],
    },
  })).status()).toBe(200);
  const published = await api.patch(`/events/${draft.id}/publish`);
  expect(published.status(), await published.text()).toBe(200);
  const body = await published.json() as { slug: string };
  return { id: draft.id, title: draft.title, slug: body.slug };
}

test.beforeAll(async () => {
  api = await apiFromState(OWNER_STATE);
  publicEvent = await createSearchEvent('public');
  await createSearchEvent('unlisted');
  await createSearchEvent('private');
});

test.afterAll(async () => {
  await cleanupEvents(api, created);
  await api.dispose();
});

test.describe('Wave H — Discovery publique', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(({ page }) => startRuntimeAudit(page));
  test.afterEach(() => {
    expect(runtimeAudit.consoleErrors, 'console.error inattendues').toEqual([]);
    expect(runtimeAudit.pageErrors, 'pageerror inattendues').toEqual([]);
    expect(runtimeAudit.serverErrors, 'HTTP >=500 inattendus').toEqual([]);
    expect(
      runtimeAudit.unauthorizedResponses.filter((url) => !/\/auth\/(me|refresh)$/.test(url)),
      '401 inattendus hors restauration de session anonyme',
    ).toEqual([]);
  });

  test('recherche multi-entités et ouvre la fiche Event publique', async ({ page }) => {
    await page.goto('/evenements/recherche');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tout l’événementiel');
    await page.getByLabel('Que recherchez-vous ?').fill(marker);
    await page.getByRole('button', { name: 'Rechercher' }).click();
    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(marker)}`));
    await expect(page.getByRole('heading', { name: publicEvent.title })).toBeVisible();
    await page.getByRole('heading', { name: publicEvent.title }).locator('xpath=ancestor::article').getByRole('link', { name: 'Voir' }).click();
    await expect(page).toHaveURL(new RegExp(`/evenements/${publicEvent.slug}$`));
    await expect(page.getByRole('heading', { name: publicEvent.title })).toBeVisible();
  });

  test('le type Vendor applique catégorie, ville et prix et conserve l’URL', async ({ page }) => {
    await page.goto('/evenements/recherche?q=Lumi%C3%A8re&type=vendor');
    await page.getByLabel('Ville').selectOption('Montréal');
    await page.getByLabel('Catégorie').selectOption('photographe');
    await page.getByLabel('Budget de départ').selectOption('$');
    await page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(page).toHaveURL(/type=vendor/);
    await expect(page).toHaveURL(/category=photographe/);
    await expect(page.getByRole('heading', { name: 'Lumière Nord' })).toBeVisible();
    await page.reload();
    await expect(page.locator('select[name="category"]:visible')).toHaveValue('photographe');
  });

  test('le type Venue applique une capacité minimale et ouvre la fiche', async ({ page }) => {
    await page.goto('/evenements/recherche?q=Maison&type=venue');
    await page.getByLabel('Capacité minimale').selectOption('200');
    await page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(page).toHaveURL(/capacity=200/);
    const venue = page.getByRole('heading', { name: 'Maison Saint-Laurent' });
    await expect(venue).toBeVisible();
    await venue.locator('xpath=ancestor::a').click();
    await expect(page).toHaveURL(/\/lieux\/[a-f0-9]{24}$/);
  });

  test('les ressources non découvrables ne sortent pas et le vide reste honnête', async ({ page }) => {
    const response = await api.get(`/discovery/search?q=${encodeURIComponent(marker)}&limit=12`);
    expect(response.status()).toBe(200);
    const body = await response.json() as { events: Array<{ _id: string }>; totals: { events: number } };
    expect(body.events.map((event) => event._id)).toEqual([publicEvent.id]);
    expect(body.totals.events).toBe(1);

    await page.goto(`/evenements/recherche?q=${marker}-introuvable`);
    await expect(page.getByTestId('search-empty-state')).toContainText('Aucun résultat');
    await expect(page.getByText(/temporairement indisponible/i)).toHaveCount(0);
  });

  test('back restaure les critères et le parcours reste accessible à 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/evenements/recherche?q=${marker}&type=event&category=gala&dateFrom=2027-05-01&dateTo=2027-05-31`);
    await expect(page.getByLabel('Catégorie')).toHaveValue('gala');
    await page.getByRole('heading', { name: publicEvent.title }).locator('xpath=ancestor::article').getByRole('link', { name: 'Voir' }).click();
    await expect(page).toHaveURL(new RegExp(`/evenements/${publicEvent.slug}$`));
    await page.goBack();
    await expect(page).toHaveURL(/\/evenements\/recherche\?/);
    await expect(page.getByTestId('public-search-page')).toBeVisible();
    await expect(page.getByLabel('Du', { exact: true })).toHaveValue('2027-05-01');
    await expect(page.getByLabel('Au', { exact: true })).toHaveValue('2027-05-31');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const violations = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(violations.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
  });

  test('les cartes représentatives n’ont pas de contour décoratif visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/evenements/recherche?q=${marker}`);
    const borders = await page.locator('.premium-card').evaluateAll((cards) => cards.map((card) => {
      const style = getComputedStyle(card);
      return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
    }));
    expect(borders.every((sides) => sides.every((width) => width === '0px'))).toBe(true);
  });

  for (const [width, height] of [[320, 720], [375, 812], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1538, 1100]] as const) {
    test(`recherche utilisable sans overflow à ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`/evenements/recherche?q=${marker}&type=event`);
      await expect(page.getByLabel('Que recherchez-vous ?')).toHaveValue(marker);
      await expect(page.getByRole('heading', { name: publicEvent.title })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const submitBox = await page.getByRole('button', { name: 'Rechercher' }).boundingBox();
      expect(submitBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    });
  }

  test('un rate-limit Search affiche une erreur récupérable et jamais un faux vide', async ({ page }) => {
    const throttleProbe = `throttle-${Date.now()}`;
    const responses = await Promise.all(Array.from({ length: 121 }, () => (
      page.request.get(`http://localhost:3001/api/v1/discovery/search?q=${throttleProbe}&limit=1`)
    )));
    expect(responses.some((response) => response.status() === 429)).toBe(true);

    await page.goto(`/evenements/recherche?q=${throttleProbe}`);
    await expect(page.getByRole('alert')).toContainText('temporairement indisponible');
    await expect(page.getByRole('link', { name: 'Réessayer' })).toHaveAttribute(
      'href',
      new RegExp(`q=${throttleProbe}`),
    );
    await expect(page.getByTestId('search-empty-state')).toHaveCount(0);

    // Ce test sature volontairement le bucket public partagé par IP. Attendre
    // son rétablissement observable évite de contaminer les specs suivantes,
    // tout en conservant exactement la limite et la fenêtre de production.
    await expect.poll(
      async () => (
        await api.get(`/discovery/search?q=${throttleProbe}-recovered&limit=1`)
      ).status(),
      {
        message: 'le bucket Search doit redevenir disponible après sa fenêtre',
        timeout: 75_000,
        intervals: [1_000],
      },
    ).toBe(200);
  });
});

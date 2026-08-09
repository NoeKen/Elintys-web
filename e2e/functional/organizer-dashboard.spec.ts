import { expect, test } from '@playwright/test';
import type { Route } from '@playwright/test';
import type { ApiClient } from './helpers';
import {
  OWNER_STATE,
  apiFromState,
  cleanupEvents,
  createDraft,
} from './helpers';

interface FixtureEvent {
  id: string;
  title: string;
  slug?: string;
}

const created: string[] = [];
let api: ApiClient;
let incomplete: FixtureEvent;
let ready: FixtureEvent;
let published: FixtureEvent;

test.describe.serial('Sprint 3 Vague 1 — dashboard organisateur et Mes événements', () => {
  test.beforeAll(async () => {
    api = await apiFromState(OWNER_STATE);
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    incomplete = await createDraft(api, {
      title: 'Sprint 3 brouillon incomplet',
      eventType: 'gala',
      creationProgress: { currentStep: 2, completedSteps: [1], skippedSteps: [] },
    });
    ready = await createDraft(api, {
      title: 'Sprint 3 prêt à publier',
      eventType: 'conference',
      startDate: future,
      location: { type: 'physical', name: 'Maison Sprint 3', city: 'Montréal' },
      discoverability: 'public',
      accessPolicy: { type: 'open' },
      admissionModes: ['registration_only'],
      creationProgress: { currentStep: 6, completedSteps: [1, 2, 3, 4, 5, 6], skippedSteps: [] },
    });
    const publishedDraft = await createDraft(api, {
      title: 'Sprint 3 publié',
      eventType: 'networking',
      startDate: future,
      location: { type: 'physical', name: 'Atrium Elintys', city: 'Montréal' },
      discoverability: 'public',
      accessPolicy: { type: 'open' },
      admissionModes: ['registration_only'],
      creationProgress: { currentStep: 6, completedSteps: [1, 2, 3, 4, 5, 6], skippedSteps: [] },
    });
    const publishResponse = await api.patch(`/events/${publishedDraft.id}/publish`);
    expect(publishResponse.ok()).toBeTruthy();
    const publishedBody = (await publishResponse.json()) as { slug?: string };
    published = { ...publishedDraft, slug: publishedBody.slug };
    created.push(incomplete.id, ready.id, published.id);

    const fillers = await Promise.all(Array.from({ length: 10 }, (_, index) => createDraft(api, {
      title: `Sprint 3 pagination ${index + 1}`,
      eventType: 'other',
      creationProgress: { currentStep: 1, completedSteps: [], skippedSteps: [] },
    })));
    created.push(...fillers.map((event) => event.id));
  });

  test.afterAll(async () => {
    await cleanupEvents(api, created);
    await api.dispose();
  });

  test('1. session organisateur et dashboard avec données réelles', async ({ page }) => {
    await page.goto('/tableau-de-bord');
    await expect(page).toHaveURL(/\/tableau-de-bord/);
    await expect(page.getByRole('heading', { name: /^Bonjour/ })).toBeVisible();
    await expect(page.getByText('Événements actifs')).toBeVisible();
  });

  test('2. KPI calculés, action prioritaire et prochain événement', async ({ page }) => {
    const response = await api.get('/events/my/summary');
    expect(response.ok()).toBeTruthy();
    const summary = (await response.json()) as { metrics: { activeEvents: number; upcomingEvents: number; draftEvents: number; pendingActions: number } };
    await page.goto('/tableau-de-bord');

    for (const [label, value] of [
      ['Événements actifs', summary.metrics.activeEvents],
      ['Dans les 30 prochains jours', summary.metrics.upcomingEvents],
      ['Brouillons', summary.metrics.draftEvents],
      ['Actions à compléter', summary.metrics.pendingActions],
    ] as const) {
      const card = page.getByText(label, { exact: true }).locator('..');
      await expect(card).toContainText(String(value));
    }
    await expect(page.getByText(/Continuer la création|Définir la date|Ajouter le lieu|Publier l’événement/).first()).toBeVisible();
    await expect(page.getByText(ready.title).first()).toBeVisible();
  });

  test('3. navigation d’une action vers un brouillon', async ({ page }) => {
    await page.goto('/tableau-de-bord');
    const action = page.locator('a[href*="/configuration?etape="]').first();
    await expect(action).toBeVisible();
    await action.click();
    await expect(page).toHaveURL(/\/configuration\?etape=\d/);
  });

  test('4. dashboard empty explicite', async ({ page }) => {
    await page.route('**/events/my/summary', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        metrics: { totalEvents: 0, activeEvents: 0, upcomingEvents: 0, draftEvents: 0, pendingActions: 0 },
        actions: [], upcoming: [], activityAvailable: false,
      }),
    }));
    await page.goto('/tableau-de-bord');
    await expect(page.getByText('Commencez votre narration événementielle')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Créer votre premier événement' })).toBeVisible();
  });

  test('5. dashboard error puis retry', async ({ page }) => {
    const failSummary = (route: Route) => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'SERVICE_UNAVAILABLE', requestId: 'sprint-3-retry' }),
    });
    await page.route('**/events/my/summary', failSummary);
    await page.goto('/tableau-de-bord');
    await expect(page.getByRole('heading', { name: 'Votre activité est momentanément inaccessible' })).toBeVisible();
    await page.unroute('**/events/my/summary', failSummary);
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByRole('heading', { name: /^Bonjour/ })).toBeVisible();
  });

  test('6. bibliothèque grille et reprise d’un draft', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    await expect(page.getByRole('heading', { name: 'Mes événements' })).toBeVisible();
    await page.getByPlaceholder('Rechercher un événement…').fill(incomplete.title);
    const card = page.getByRole('heading', { name: incomplete.title }).locator('xpath=ancestor::article');
    await expect(card).toBeVisible();
    await card.getByRole('link', { name: 'Continuer' }).click();
    await expect(page).toHaveURL(new RegExp(`/tableau-de-bord/evenements/${incomplete.id}/configuration\\?etape=2`));
  });

  test('7. vue liste responsive', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    await page.getByRole('button', { name: 'Liste' }).click();
    await expect(page.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Dernière modification').first()).toBeVisible();
  });

  test('8. recherche titre, type et lieu', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    const search = page.getByPlaceholder('Rechercher un événement…');
    await search.fill(ready.title);
    await expect(page.getByRole('heading', { name: ready.title })).toBeVisible();
    await search.fill('Maison Sprint 3');
    await expect(page.getByRole('heading', { name: ready.title })).toBeVisible();
    await search.fill('networking');
    await expect(page.getByRole('heading', { name: published.title })).toBeVisible();
  });

  test('9. onglets brouillons, à publier et publiés', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    await page.getByRole('tab', { name: 'Brouillons' }).click();
    await expect(page.getByText(incomplete.title).first()).toBeVisible();
    await page.getByRole('tab', { name: 'À publier' }).click();
    await expect(page.getByText(ready.title).first()).toBeVisible();
    await page.getByRole('tab', { name: 'Publiés' }).click();
    await expect(page.getByText(published.title).first()).toBeVisible();
  });

  test('10. tri et filtres fonctionnels', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/events/my?')) requests.push(request.url());
    });
    await page.goto('/tableau-de-bord/evenements');
    await page.getByLabel('Plus récents').selectOption('title_asc');
    await page.getByRole('button', { name: /^Filtres/ }).click();
    await page.getByLabel('Visibilité').selectOption('public');
    await page.getByLabel('Politique d’accès').selectOption('open');
    await expect.poll(() => requests.some((url) => url.includes('sort=title_asc') && url.includes('discoverability=public') && url.includes('accessPolicy=open'))).toBeTruthy();
  });

  test('11. pagination serveur', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    const next = page.getByRole('button', { name: 'Page suivante' });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByText('Page 2 sur', { exact: false })).toBeVisible();
  });

  test('12. prévisualiser un événement publié', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    await page.getByPlaceholder('Rechercher un événement…').fill(published.title);
    const card = page.getByRole('heading', { name: published.title }).locator('xpath=ancestor::article');
    await card.getByRole('button', { name: `Plus d’actions pour ${published.title}` }).click();
    await page.getByRole('menuitem', { name: 'Prévisualiser' }).click();
    await expect(page).toHaveURL(new RegExp(`/evenements/${published.slug}`));
  });

  test('13. publier lorsque la readiness est valide', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    await page.getByPlaceholder('Rechercher un événement…').fill(ready.title);
    const card = page.getByRole('heading', { name: ready.title }).locator('xpath=ancestor::article');
    await card.getByRole('button', { name: 'Publier', exact: true }).click();
    await expect(card.getByText('Publié', { exact: true })).toBeVisible();
  });

  test('14. archive et restauration réversibles', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    await page.getByPlaceholder('Rechercher un événement…').fill(incomplete.title);
    let card = page.getByRole('heading', { name: incomplete.title }).locator('xpath=ancestor::article');
    await card.getByRole('button', { name: `Plus d’actions pour ${incomplete.title}` }).click();
    await page.getByRole('menuitem', { name: 'Archiver' }).click();
    await expect(page.getByText('Aucun événement ne correspond à cette vue')).toBeVisible();

    await page.getByRole('button', { name: 'Effacer les filtres' }).click();
    await page.getByRole('tab', { name: 'Archivés' }).click();
    card = page.getByRole('heading', { name: incomplete.title }).locator('xpath=ancestor::article');
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Restaurer' }).click();
    await expect(page.getByText('Aucun événement ne correspond à cette vue')).toBeVisible();
  });

  test('15. mobile sans overflow, grille et liste utilisables', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tableau-de-bord/evenements');
    await expect(page.getByRole('heading', { name: 'Mes événements' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'Liste' }).click();
    await expect(page.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  });
});

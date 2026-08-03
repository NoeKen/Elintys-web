import { test, expect, capture, installApiBridge, waitForHydration } from './fixtures';
import { API_URL, credentials } from './qa-data';

test('connexion mobile et erreur d’authentification', async ({ page, context }, testInfo) => {
  testInfo.annotations.push({ type: 'expected-http-error', description: '401 de test attendu' });
  await context.clearCookies();
  await installApiBridge(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/connexion');
  await waitForHydration(page);
  await capture(page, 'auth-login-390x844', 'mobile');
  await page.locator('input[type="email"]').fill(credentials().email);
  await page.locator('input[type="password"]').fill('mot-de-passe-qa-invalide');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByText(/erreur|incorrect|réessayer/i).first()).toBeVisible();
  await capture(page, 'auth-error-390x844', 'mobile');
});

test('Mes événements affiche loading, empty et error sans page blanche', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1538, height: 1100 });
  let release: (() => Promise<void>) | undefined;
  await page.route(`${API_URL}/events/my**`, async (route) => {
    await new Promise<void>((resolve) => { release = async () => { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], meta: { total: 0, page: 1, perPage: 100, lastPage: 1 } }) }); resolve(); }; });
  });
  await page.goto('/tableau-de-bord/evenements');
  await expect(page.locator('.premium-skeleton').first()).toBeVisible();
  await page.screenshot({ path: 'docs/design-qa/event-experience/implementations/events-loading-1538x1100.png', fullPage: true });
  await release?.();
  await expect(page.getByText('Aucun événement ne correspond à cette vue')).toBeVisible();
  await capture(page, 'events-empty-1538x1100');
  await page.unroute(`${API_URL}/events/my**`);

  testInfo.annotations.push({ type: 'expected-http-error', description: '503 simulé pour l’état error' });
  await page.route(`${API_URL}/events/my**`, (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'SERVICE_UNAVAILABLE', requestId: 'visual-qa' }) }));
  await page.goto('/tableau-de-bord/evenements');
  await expect(page.getByRole('heading', { name: 'Impossible de charger vos événements' })).toBeVisible();
  await capture(page, 'events-error-1538x1100');
});

test('dashboard nouveau sans événement', async ({ page }) => {
  await page.route(`${API_URL}/events/my**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], meta: { total: 0, page: 1, perPage: 100, lastPage: 1 } }) }));
  await page.setViewportSize({ width: 1538, height: 1100 });
  await page.goto('/tableau-de-bord');
  await expect(page.getByText('Commencez votre narration événementielle')).toBeVisible();
  await capture(page, 'dashboard-empty-1538x1100');
});

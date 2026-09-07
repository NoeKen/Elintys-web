import { expect, test } from '@playwright/test';
import type { ApiClient } from './helpers';
import { apiContextFor, ownerCredentials, waitForHydration } from './helpers';

/**
 * Restauration de session dégradée.
 *
 * `refreshSession` capturait toute erreur et renvoyait `null` : le provider en
 * concluait « pas de session » et le garde redirigeait vers la connexion. Une
 * panne d'API, un 429 ou une coupure réseau déconnectaient donc un utilisateur
 * parfaitement authentifié.
 *
 * Ces parcours interceptent `/auth/me` au niveau du navigateur : aucune
 * modification serveur, aucune donnée touchée.
 */
test.describe.configure({ mode: 'serial' });

let owner: ApiClient;

test.beforeAll(async () => {
  owner = await apiContextFor(ownerCredentials());
});

test.afterAll(async () => {
  await owner.dispose();
});

async function authenticatedPage(browser: import('@playwright/test').Browser) {
  const context = await browser.newContext({ storageState: await owner.storageState() });
  return { context, page: await context.newPage() };
}

test.describe('Vague A — dégradation de la restauration de session', () => {
  for (const status of [500, 503, 429] as const) {
    test(`un ${status} sur /auth/me ne déconnecte pas`, async ({ browser }) => {
      const { context, page } = await authenticatedPage(browser);
      try {
        await context.route('**/api/v1/auth/me', (route) =>
          route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify({ statusCode: status, message: 'indisponible' }),
          }),
        );

        await page.goto('/tableau-de-bord/favoris');
        await waitForHydration(page);

        // Ni redirection vers la connexion, ni page blanche : un état dégradé
        // explicite, avec la possibilité de réessayer.
        await expect(page).not.toHaveURL(/\/connexion/);
        await expect(page.getByTestId('session-unavailable')).toBeVisible();
        await expect(page.getByTestId('session-retry')).toBeVisible();
      } finally {
        await context.close();
      }
    });
  }

  test('une coupure réseau sur /auth/me ne déconnecte pas', async ({ browser }) => {
    const { context, page } = await authenticatedPage(browser);
    try {
      await context.route('**/api/v1/auth/me', (route) => route.abort('failed'));

      await page.goto('/tableau-de-bord/favoris');
      await waitForHydration(page);

      await expect(page).not.toHaveURL(/\/connexion/);
      await expect(page.getByTestId('session-unavailable')).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('un 401 sur /auth/me redirige bien vers la connexion', async ({ browser }) => {
    const { context, page } = await authenticatedPage(browser);
    try {
      // Absence CONFIRMÉE : le comportement de redirection doit être préservé.
      // Le rafraîchissement est aussi neutralisé, sinon le client réessaie.
      await context.route('**/api/v1/auth/refresh', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
      );
      await context.route('**/api/v1/auth/me', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
      );

      await page.goto('/tableau-de-bord/favoris');

      await expect(page).toHaveURL(/\/connexion\?redirect=/);
    } finally {
      await context.close();
    }
  });

  test('le réessai rétablit la session une fois l’API revenue', async ({ browser }) => {
    const { context, page } = await authenticatedPage(browser);
    try {
      let failing = true;
      await context.route('**/api/v1/auth/me', async (route) => {
        if (failing) {
          await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
          return;
        }
        await route.fallback();
      });

      await page.goto('/tableau-de-bord/favoris');
      await waitForHydration(page);
      await expect(page.getByTestId('session-unavailable')).toBeVisible();

      failing = false;
      await page.getByTestId('session-retry').click();

      await expect(page.getByTestId('session-unavailable')).toBeHidden();
      await expect(page).not.toHaveURL(/\/connexion/);
    } finally {
      await context.close();
    }
  });

  test('aucun réessai automatique en boucle contre une API en panne', async ({ browser }) => {
    const { context, page } = await authenticatedPage(browser);
    try {
      let calls = 0;
      await context.route('**/api/v1/auth/me', async (route) => {
        calls += 1;
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      });

      await page.goto('/tableau-de-bord/favoris');
      await expect(page.getByTestId('session-unavailable')).toBeVisible();
      await page.waitForTimeout(2500);

      // Rejouer en boucle aggraverait la panne et déclencherait le rate-limit.
      expect(calls).toBeLessThanOrEqual(1);
    } finally {
      await context.close();
    }
  });
});

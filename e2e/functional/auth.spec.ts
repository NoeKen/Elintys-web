import { expect, test } from '@playwright/test';
import { anonymousApi, ownerCredentials, waitForHydration } from './helpers';

test.describe('Authentification', () => {
  test('devrait rediriger un visiteur anonyme depuis une route protégée', async ({ browser }) => {
    // Contexte neuf, sans storageState : visiteur réellement anonyme.
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    for (const route of ['/tableau-de-bord', '/organisateur', '/parametres']) {
      const initialResponse = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(initialResponse, `${route} doit être rendu par Next.js avant la garde cliente`).not.toBeNull();
      expect(initialResponse?.status(), `${route} ne doit pas être redirigé par un proxy Next.js`).toBe(200);
      expect(
        new URL(initialResponse?.url() ?? page.url()).pathname,
        `${route} doit être la réponse de navigation initiale`,
      ).toBe(route);
      await expect(page, `${route} doit renvoyer vers la connexion`).toHaveURL(/\/connexion/);
      expect(page.url(), 'le chemin de retour doit être conservé').toContain('redirect=');
    }
    await context.close();
  });

  test('ne devrait PAS rediriger les routes publiques', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    for (const route of ['/', '/evenements', '/prestataires', '/lieux']) {
      await page.goto(route);
      await expect(page, `${route} doit rester accessible`).not.toHaveURL(/\/connexion/);
    }
    await context.close();
  });

  test('devrait accéder au tableau de bord une fois connecté', async ({ page }) => {
    await page.goto('/tableau-de-bord');
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/tableau-de-bord/);
    await expect(page.getByText(/tableau de bord/i).first()).toBeVisible();
  });

  test('devrait renvoyer un utilisateur connecté hors des pages auth-only', async ({ page }) => {
    await page.goto('/connexion');
    await expect(page).toHaveURL(/\/tableau-de-bord/);
  });


  test('devrait refuser des identifiants erronés sans divulguer l’existence du compte', async () => {
    const { email } = ownerCredentials();
    const anonymous = await anonymousApi();

    const existing = await anonymous.post('/auth/login', {
      data: { email, password: 'MauvaisMotDePasse1!' },
    });
    const unknown = await anonymous.post('/auth/login', {
      data: { email: 'inconnu-e2e@demo.elintys.com', password: 'MauvaisMotDePasse1!' },
    });

    expect(existing.status()).toBe(401);
    expect(unknown.status()).toBe(401);
    // Message identique : pas d'énumération de comptes.
    expect((await existing.json()).message).toEqual((await unknown.json()).message);
    await anonymous.dispose();
  });
});

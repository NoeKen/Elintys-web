import fs from 'node:fs';
import { expect, test as setup } from '@playwright/test';
import { request } from '@playwright/test';
import {
  API_URL,
  E2E_DIR,
  OWNER_STATE,
  apiFromState,
  ownerCredentials,
  secondaryCredentials,
  TIERS_STATE,
  waitForHydration,
} from './helpers';

/**
 * Génération des sessions utilisées par les specs authentifiées.
 *
 * Ce projet est une DÉPENDANCE des projets fonctionnels (cf.
 * playwright.config.ts) : il s'exécute avant eux, à chaque invocation.
 *
 * Le tier AUTH_STRICT plafonne à 5 connexions par minute et par IP. Une
 * nouvelle connexion à chaque exécution épuiserait ce quota dès qu'on itère
 * spec par spec. Chaque état encore valide est donc RÉUTILISÉ : on ne se
 * reconnecte que lorsque la session stockée ne répond plus.
 */
async function storedSessionIsValid(statePath: string): Promise<boolean> {
  if (!fs.existsSync(statePath)) return false;

  // Client rafraîchissant : un jeton d'accès expiré mais dont le cookie de
  // rafraîchissement reste valide est RENOUVELÉ, sans consommer une connexion.
  const client = await apiFromState(statePath);
  try {
    const response = await client.get('/auth/me');
    if (response.status() !== 200) return false;

    // Réécrire l'état : il porte peut-être un jeton fraîchement renouvelé, et
    // il doit rester valide pendant toute la durée de la suite.
    fs.writeFileSync(statePath, JSON.stringify(await client.storageState(), null, 2));
    return true;
  } catch {
    return false;
  } finally {
    await client.dispose();
  }
}

setup('connexion UI du compte propriétaire et sauvegarde de la session', async ({ page, context }) => {
  fs.mkdirSync(E2E_DIR, { recursive: true });

  if (await storedSessionIsValid(OWNER_STATE)) return;

  const { email, password } = ownerCredentials();
  await page.goto('/connexion');
  await waitForHydration(page);

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/auth/login'),
  );
  await page.getByRole('button', { name: /se connecter/i }).click();
  expect((await loginResponse).status(), 'statut HTTP de la connexion UI').toBe(200);

  await page.waitForURL(/\/tableau-de-bord/);
  await context.storageState({ path: OWNER_STATE });
});

setup('session API du compte tiers', async () => {
  fs.mkdirSync(E2E_DIR, { recursive: true });

  if (await storedSessionIsValid(TIERS_STATE)) return;

  const tiers = await request.newContext({ extraHTTPHeaders: { Origin: 'http://localhost:3000' } });
  const response = await tiers.post(`${API_URL}/auth/login`, { data: secondaryCredentials() });
  expect(response.status(), 'connexion API du compte tiers').toBe(200);
  await tiers.storageState({ path: TIERS_STATE });
  await tiers.dispose();
});

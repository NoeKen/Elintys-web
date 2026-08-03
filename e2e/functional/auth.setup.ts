import fs from 'node:fs';
import { expect, test as setup } from '@playwright/test';
import { request } from '@playwright/test';
import {
  API_URL,
  E2E_DIR,
  OWNER_STATE,
  ownerCredentials,
  secondaryCredentials,
  TIERS_STATE,
  waitForHydration,
} from './helpers';

setup('connexion UI du compte propriétaire et sauvegarde de la session', async ({ page, context }) => {
  fs.mkdirSync(E2E_DIR, { recursive: true });

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
  // Une seule connexion pour le tiers : le rate-limit auth reste strict.
  const tiers = await request.newContext({ extraHTTPHeaders: { Origin: 'http://localhost:3000' } });
  const response = await tiers.post(`${API_URL}/auth/login`, { data: secondaryCredentials() });
  expect(response.status(), 'connexion API du compte tiers').toBe(200);
  await tiers.storageState({ path: TIERS_STATE });
  await tiers.dispose();
});

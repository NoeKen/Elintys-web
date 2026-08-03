import { test as setup, expect } from '@playwright/test';
import path from 'node:path';
import { credentials, QA_STATE } from './qa-data';
import { installApiBridge, stabilize, waitForHydration } from './fixtures';

setup('connexion UI et storageState', async ({ page, context }) => {
  await installApiBridge(context);
  await page.setViewportSize({ width: 1538, height: 1100 });
  await page.goto('/connexion');
  await waitForHydration(page);
  await stabilize(page);
  await page.screenshot({ path: path.resolve('docs/design-qa/event-experience/implementations/auth-login-desktop.png'), fullPage: true });
  const { email, password } = credentials();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  const loginResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/login'));
  await page.getByRole('button', { name: /se connecter/i }).click();
  expect((await loginResponse).status(), 'statut HTTP de connexion UI').toBe(200);
  await page.waitForURL(/\/tableau-de-bord(?:\/)?$/);
  await expect(page.getByText(/tableau de bord/i).first()).toBeVisible();
  await context.storageState({ path: QA_STATE });
});

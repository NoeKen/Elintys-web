import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  accountCredentials,
  apiContextFor,
  freshApiContextFor,
  recoveryCredentials,
  verificationCredentials,
  waitForHydration,
  waveGResetToken,
  waveGVerificationToken,
} from './helpers';

test.describe.configure({ mode: 'serial' });

const QA_ROOT = path.resolve('docs/design-qa/sprint-4-wave-g');
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
const EXPECTED_ANONYMOUS_401 =
  /Failed to load resource: the server responded with a status of 401 \(Unauthorized\)/;
const EXPECTED_RATE_LIMIT_429 =
  /Failed to load resource: the server responded with a status of 429 \(Too Many Requests\)/;

let accountApi: Awaited<ReturnType<typeof apiContextFor>>;
const axeSurfaces: Array<{ viewport: string; violations: unknown[] }> = [];

type RuntimeAudit = {
  consoleErrors: string[];
  pageErrors: string[];
  unexpectedServerResponses: string[];
};

function auditRuntime(page: Page): RuntimeAudit {
  const audit: RuntimeAudit = {
    consoleErrors: [],
    pageErrors: [],
    unexpectedServerResponses: [],
  };
  page.on('console', (message) => {
    if (message.type() === 'error') audit.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => audit.pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500) {
      audit.unexpectedServerResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  return audit;
}

function expectRuntimeClean(
  audit: RuntimeAudit,
  allowedConsoleErrors: RegExp[] = [],
): void {
  const unexpectedConsoleErrors = audit.consoleErrors.filter(
    (message) => !allowedConsoleErrors.some((allowed) => allowed.test(message)),
  );
  expect(unexpectedConsoleErrors, 'unexpected console.error').toEqual([]);
  expect(audit.pageErrors, 'unexpected pageerror').toEqual([]);
  expect(audit.unexpectedServerResponses, 'unexpected HTTP >= 500').toEqual([]);
}

async function blockingAxe(page: Page, viewport: string): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  axeSurfaces.push({ viewport, violations: result.violations });
  const blocking = result.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
  expect(blocking, `${viewport}: axe critical/serious`).toEqual([]);
}

test.beforeAll(async () => {
  test.setTimeout(180_000);
  fs.mkdirSync(IMPLEMENTATIONS, { recursive: true });
  accountApi = await apiContextFor(accountCredentials());
});

test.afterAll(async () => {
  await accountApi?.patch('/auth/me/profile', {
    data: { firstName: 'QA', lastName: 'Compte' },
  }).catch(() => undefined);
  await accountApi?.patch('/auth/me/notification-preferences', {
    data: {
      vendorRequestReceived: true,
      vendorResponse: true,
      venueBookingReceived: true,
      venueResponse: true,
    },
  }).catch(() => undefined);
  await accountApi?.dispose();
  if (axeSurfaces.length > 0) {
    fs.writeFileSync(AXE_REPORT, `${JSON.stringify({ generatedAt: new Date().toISOString(), surfaces: axeSurfaces }, null, 2)}\n`);
  }
});

test('profil, préférences et rôle persistent depuis la vraie UI', async ({ browser }) => {
  const context = await browser.newContext({ storageState: await accountApi.storageState() });
  const page = await context.newPage();
  const runtime = auditRuntime(page);
  try {
    await page.goto('/parametres');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: 'Paramètres du compte' })).toBeVisible();

    await page.getByLabel('Prénom').fill('Wave');
    await page.getByLabel('Nom', { exact: true }).fill('Compte');
    const profileResponse = page.waitForResponse((response) => response.url().includes('/auth/me/profile'));
    await page.getByRole('button', { name: 'Enregistrer le profil' }).click();
    expect((await profileResponse).status()).toBe(200);
    await expect(page.getByRole('status').filter({ hasText: 'Profil mis à jour' })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Prénom')).toHaveValue('Wave');

    const vendorResponse = page.getByRole('checkbox', { name: /Réponses des prestataires/ });
    if (await vendorResponse.isChecked()) await vendorResponse.uncheck();
    const preferencesResponse = page.waitForResponse((response) => response.url().includes('/auth/me/notification-preferences'));
    await page.getByRole('button', { name: 'Enregistrer les préférences' }).click();
    expect((await preferencesResponse).status()).toBe(200);
    await page.reload();
    await expect(page.getByRole('checkbox', { name: /Réponses des prestataires/ })).not.toBeChecked();

    const addVendor = page.getByRole('button', { name: 'Ajouter le rôle Prestataire' });
    if (await addVendor.count()) {
      const roleResponse = page.waitForResponse((response) => response.url().includes('/auth/me/roles'));
      await addVendor.click();
      expect((await roleResponse).status()).toBe(200);
    }
    await expect(page.getByText('Prestataire', { exact: true }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: 'Mon profil' }).first()).toBeVisible();
    expectRuntimeClean(runtime);
  } finally {
    await context.close();
  }
});

test('l’API refuse explicitement toute escalade ADMIN', async () => {
  const response = await accountApi.post('/auth/me/roles', { data: { role: 'admin' } });
  expect(response.status()).toBe(400);
  const me = await accountApi.get('/auth/me');
  expect((await me.json()).roles).not.toContain('admin');
});

test('changement de mot de passe : ancien refusé, nouveau accepté, puis état restauré', async ({ browser }) => {
  test.setTimeout(180_000);
  const original = accountCredentials().password;
  const changed = `${original.slice(0, 55)}G2!`;
  const context = await browser.newContext({ storageState: await accountApi.storageState() });
  const page = await context.newPage();
  const runtime = auditRuntime(page);
  try {
    await page.goto('/parametres#securite');
    await page.getByLabel('Mot de passe actuel').fill(original);
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill(changed);
    await page.getByLabel('Confirmer le nouveau mot de passe').fill(changed);
    await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
    await expect(page).toHaveURL(/\/connexion\?reason=password_changed/);

    await page.locator('input[type="email"]').fill(accountCredentials().email);
    await page.locator('input[type="password"]').fill(original);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    await page.locator('input[type="password"]').fill(changed);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await page.waitForURL(/\/tableau-de-bord/);

    await page.goto('/parametres#securite');
    await page.getByLabel('Mot de passe actuel').fill(changed);
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill(original);
    await page.getByLabel('Confirmer le nouveau mot de passe').fill(original);
    await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
    await expect(page).toHaveURL(/\/connexion\?reason=password_changed/);
    await accountApi.dispose();
    accountApi = await freshApiContextFor(accountCredentials());
    expectRuntimeClean(runtime, [EXPECTED_ANONYMOUS_401]);
  } finally {
    await context.close();
  }
});

test('vérification email : token réel puis retour explicite vers la connexion', async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  const runtime = auditRuntime(page);
  try {
    const response = page.waitForResponse((item) => item.url().includes('/auth/verify-email'));
    await page.goto(`/verification-email?email=${encodeURIComponent(verificationCredentials().email)}&token=${waveGVerificationToken()}`);
    expect((await response).status()).toBe(200);
    await expect(page).toHaveURL(/\/connexion\?verified=1/);
    expectRuntimeClean(runtime, [EXPECTED_ANONYMOUS_401]);
  } finally {
    await context.close();
  }
});

test('mot de passe oublié reste neutre et reset consomme un token QA réel', async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  const runtime = auditRuntime(page);
  const changed = `${recoveryCredentials().password.slice(0, 55)}R2!`;
  try {
    await page.goto('/mot-de-passe-oublie');
    await page.locator('input[type="email"]').fill('adresse-inconnue-wave-g@example.ca');
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();
    await expect(page.getByRole('heading', { name: 'Lien envoyé !' })).toBeVisible();

    await page.goto(`/reinitialiser-mot-de-passe?token=${waveGResetToken()}`);
    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill(changed);
    await passwords.nth(1).fill(changed);
    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(page.getByRole('heading', { name: 'Mot de passe réinitialisé !' })).toBeVisible();

    const recoveryApi = await apiContextFor({ email: recoveryCredentials().email, password: changed });
    const restore = await recoveryApi.post('/auth/me/change-password', {
      data: { currentPassword: changed, newPassword: recoveryCredentials().password },
    });
    expect(restore.status()).toBe(200);
    await recoveryApi.dispose();
    expectRuntimeClean(runtime, [EXPECTED_ANONYMOUS_401]);
  } finally {
    await context.close();
  }
});

test('429 sur une mutation affiche une erreur sans faux logout', async ({ browser }) => {
  const context = await browser.newContext({ storageState: await accountApi.storageState() });
  const page = await context.newPage();
  const runtime = auditRuntime(page);
  try {
    await page.route('**/auth/me/profile', (route) => route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'rate limited' }),
    }));
    await page.goto('/parametres');
    await page.getByLabel('Prénom').fill('Erreur');
    await page.getByRole('button', { name: 'Enregistrer le profil' }).click();
    await expect(page.getByText('Trop de tentatives. Patientez avant de réessayer.'))
      .toBeVisible();
    await expect(page).toHaveURL(/\/parametres/);
    expectRuntimeClean(runtime, [EXPECTED_RATE_LIMIT_429]);
  } finally {
    await context.close();
  }
});

for (const viewport of VIEWPORTS) {
  test(`responsive et Axe à ${viewport.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: await accountApi.storageState(),
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();
    const runtime = auditRuntime(page);
    try {
      await page.goto('/parametres');
      await waitForHydration(page);
      await page.getByRole('link', { name: 'Sécurité', exact: true }).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, viewport.name).toBeLessThanOrEqual(1);
      await blockingAxe(page, viewport.name);
      if (viewport.name === '390x844' || viewport.name === '1440x900') {
        await page.screenshot({ path: path.join(IMPLEMENTATIONS, `settings-${viewport.name}.png`), fullPage: true });
      }
      expectRuntimeClean(runtime);
    } finally {
      await context.close();
    }
  });
}

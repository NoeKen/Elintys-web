import { expect, test, type Page, type Route } from '@playwright/test';
import messages from '../../messages/fr.json';

/**
 * Parcours « courriel non vérifié » — réseau entièrement simulé.
 *
 * L'API est l'autorité : elle refuse les mutations métier d'un compte non
 * vérifié (403 `EMAIL_NOT_VERIFIED`). Cette spec vérifie que le frontend
 * l'annonce (bandeau persistant), permet le renvoi du lien avec un délai
 * visible, et n'échoue jamais en silence quand une mutation est refusée.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3999/api/v1';
const WEB_ORIGIN = 'http://localhost:3000';
const copy = messages.emailVerification;

const unverifiedUser = {
  _id: 'user-e2e-unverified',
  fullName: 'Ana Tremblay',
  email: 'ana.unverified@example.test',
  roles: ['participant'],
  isEmailVerified: false,
  onboardingCompleted: true,
  onboardingByRole: { participant: true },
};

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': WEB_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  };
}

async function json(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: corsHeaders(),
    body: JSON.stringify(body),
  });
}

interface ApiCalls {
  resend: number;
}

async function mockUnverifiedSession(page: Page): Promise<ApiCalls> {
  const calls: ApiCalls = { resend: 0 };
  await page.route(`${API_URL}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, '');
    const method = request.method();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    if (method === 'GET' && path === '/auth/me') {
      await json(route, 200, unverifiedUser);
      return;
    }
    if (method === 'POST' && path === '/auth/me/resend-verification') {
      calls.resend += 1;
      await json(route, 200, { message: 'Un lien a été envoyé.' });
      return;
    }
    if (method === 'PATCH' && path === '/auth/me/profile') {
      await json(route, 403, {
        statusCode: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Vérifiez votre adresse courriel pour effectuer cette action.',
        requestId: 'req-e2e-unverified',
      });
      return;
    }
    await route.fallback();
  });
  return calls;
}

test.describe('Courriel non vérifié', () => {
  test('devrait afficher le bandeau et renvoyer le lien avec un délai visible', async ({ page }) => {
    const calls = await mockUnverifiedSession(page);
    await page.goto('/parametres');

    const banner = page.getByTestId('email-verification-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(copy.bannerTitle);
    await expect(page.getByTestId('email-verification-banner-email')).toHaveText(
      unverifiedUser.email,
    );

    const resend = page.getByTestId('email-verification-banner-resend');
    await resend.click();

    await expect(page.getByTestId('email-verification-banner-success')).toHaveText(
      copy.resendSuccess,
    );
    await expect(resend).toBeDisabled();
    await expect(resend).toContainText(/\d+ s/);
    expect(calls.resend).toBe(1);
  });

  test('devrait ouvrir le dialogue de vérification quand une mutation est refusée', async ({ page }) => {
    const calls = await mockUnverifiedSession(page);
    await page.goto('/parametres');
    await expect(page.getByTestId('email-verification-banner')).toBeVisible();

    await page.getByTestId('account-profile-submit').click();

    const dialog = page.getByRole('dialog', { name: copy.dialogTitle });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(unverifiedUser.email);

    // Le renvoi est possible directement depuis le dialogue, et le délai est
    // partagé avec le bandeau (un seul état de renvoi pour toute l'app).
    await page.getByTestId('email-verification-dialog-resend').click();
    await expect(page.getByTestId('email-verification-dialog-success')).toHaveText(
      copy.resendSuccess,
    );
    await expect(page.getByTestId('email-verification-dialog-resend')).toBeDisabled();
    expect(calls.resend).toBe(1);
  });
});

test.describe('Espace connecté — visiteur anonyme', () => {
  test('devrait rediriger vers la connexion en conservant la destination', async ({ page }) => {
    await page.goto('/parametres');

    await expect(page).toHaveURL(/\/connexion\?redirect=%2Fparametres/);
  });
});

import { expect, test } from '@playwright/test';
import { anonymousApi, apiFromState, API_URL, OWNER_STATE } from './helpers';

type EventList = { data?: Array<{ _id?: string; id?: string }> } | Array<{ _id?: string; id?: string }>;

async function firstPublicEventId(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const response = await request.get(`${API_URL}/events?limit=1`);
  expect(response.status()).toBe(200);
  const payload = (await response.json()) as EventList;
  const first = Array.isArray(payload) ? payload[0] : payload.data?.[0];
  const id = first?._id ?? first?.id;
  if (!id) throw new Error('Aucun événement public disponible pour le smoke diagnostique.');
  return id;
}

test.describe('audit transversal — contrats réseau', () => {
  /**
   * Ces deux tests ont été RETOURNÉS pendant la vague corrective A.
   *
   * Rédigés pendant l'audit, ils supposaient que la correction consisterait à
   * ajouter `/favorites/check/:id` et `/favorites/me` côté API. La résolution
   * retenue est l'inverse : le contrat canonique est celui du contrôleur
   * existant, et c'est le client web qui a été réaligné. Ils vérifient donc
   * désormais que ces routes n'existent PAS et que la route canonique existe —
   * ce qui protège contre une réintroduction du contrat fantôme.
   */
  test('les routes Favoris fantômes n’existent pas et ne doivent pas revenir', async ({ request }) => {
    const eventId = await firstPublicEventId(request);

    const check = await request.get(`${API_URL}/favorites/check/${eventId}?type=event`);
    const me = await request.get(`${API_URL}/favorites/me`);
    const byPath = await request.delete(`${API_URL}/favorites/${eventId}?type=event`);

    expect(check.status()).toBe(404);
    expect(me.status()).toBe(404);
    expect(byPath.status()).toBe(404);
  });

  test('la route Favoris canonique existe et est protégée', async ({ request }) => {
    // 401 (et non 404) prouve que la route existe et exige une session.
    const list = await request.get(`${API_URL}/favorites`);
    const add = await request.post(`${API_URL}/favorites`, {
      data: { targetType: 'event', targetId: '507f1f77bcf86cd799439011' },
    });

    expect(list.status()).toBe(401);
    expect(add.status()).toBe(401);
  });

  test('le payload réellement envoyé par le scanner est accepté par son DTO', async () => {
    const api = await apiFromState(OWNER_STATE);
    try {
      const refresh = await api.post('/auth/refresh');
      expect(refresh.status(), await refresh.text()).toBe(200);
      const response = await api.post('/tickets/scan', {
        data: {
          eventId: '507f1f77bcf86cd799439011',
          qrCode: 'diagnostic-invalid-code',
        },
      });
      const payload = (await response.json()) as { message?: string | string[] };

      // Authentifié, un code inconnu devrait atteindre le service et produire
      // 404. Le 400 prouve que le DTO rejette le payload réellement envoyé par l'UI.
      expect(response.status(), JSON.stringify(payload)).not.toBe(400);
    } finally {
      await api.dispose();
    }
  });

  /**
   * Également RETOURNÉ : la version d'audit supposait l'ajout d'alias `PUT`.
   * La résolution retenue est d'aligner le client sur le verbe du contrôleur.
   */
  test('les réponses prestataire et lieu passent par PATCH, pas par PUT', async () => {
    const api = await anonymousApi();
    try {
      const vendorPatch = await api.patch('/vendors/requests/507f1f77bcf86cd799439011/respond', {
        data: { status: 'accepted', responseMessage: 'diagnostic' },
      });
      const venuePatch = await api.patch('/venues/bookings/507f1f77bcf86cd799439011/respond', {
        data: { status: 'confirmed', responseMessage: 'diagnostic' },
      });
      const vendorPut = await api.put('/vendors/requests/507f1f77bcf86cd799439011/respond', {
        data: { status: 'accepted', responseMessage: 'diagnostic' },
      });

      // Route existante et protégée : 401/403, jamais 404.
      expect([401, 403]).toContain(vendorPatch.status());
      expect([401, 403]).toContain(venuePatch.status());
      // Le verbe fantôme reste absent : aucun alias n'a été ajouté.
      expect(vendorPut.status()).toBe(404);
    } finally {
      await api.dispose();
    }
  });

  test('les profils prestataire et lieu ont leur route /me explicite', async () => {
    const api = await anonymousApi();
    try {
      // 401 prouve que PUT /vendors/me est déclaré. Avant la vague, la requête
      // tombait sur PUT /vendors/:id avec id="me" et produisait une 500.
      const vendor = await api.put('/vendors/me', { data: { businessName: 'diagnostic' } });
      const venue = await api.put('/venues/me', { data: { name: 'diagnostic' } });

      expect([401, 403]).toContain(vendor.status());
      expect([401, 403]).toContain(venue.status());
    } finally {
      await api.dispose();
    }
  });
});

test.describe('audit transversal — affordances anonymes', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('le favori événement demande une connexion et préserve le retour', async ({ page }) => {
    await page.goto('/evenements');
    const button = page.getByTestId('favorite-button').first();
    await expect(button).toBeVisible();
    await button.click();

    await expect(page).toHaveURL(/\/connexion\?redirect=/);
  });

  for (const entry of [
    { route: '/prestataires', label: /ajouter ce prestataire aux favoris/i },
    { route: '/lieux', label: /ajouter ce lieu aux favoris/i },
  ]) {
    test(`l'action ${entry.route} ne reste pas muette`, async ({ page }) => {
      await page.goto(entry.route);
      const button = page.getByRole('button', { name: entry.label }).first();
      await expect(button).toBeVisible();
      await button.click();

      await expect(page).toHaveURL(/\/connexion\?redirect=/);
    });
  }

  test('la route scanner protège l’expérience avant ouverture caméra', async ({ page }) => {
    await page.goto('/scan/507f1f77bcf86cd799439011');

    await expect(page).toHaveURL(/\/connexion\?redirect=/);
  });
});

test.describe('audit transversal — smoke responsive public', () => {
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`catalogues utilisables à ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const route of ['/evenements', '/prestataires', '/lieux']) {
        const failures: string[] = [];
        const listener = (response: import('@playwright/test').Response) => {
          const expectedAnonymousBootstrap =
            response.status() === 401 &&
            (/\/auth\/me$/.test(response.url()) || /\/auth\/refresh$/.test(response.url()));
          if (response.url().includes('/api/v1/') && response.status() >= 400 && !expectedAnonymousBootstrap) {
            failures.push(`${response.status()} ${response.request().method()} ${response.url()}`);
          }
        };
        page.on('response', listener);
        await page.goto(route);
        await expect(page.locator('main, section').first()).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(1);
        page.off('response', listener);
        expect(failures).toEqual([]);
      }
    });
  }
});

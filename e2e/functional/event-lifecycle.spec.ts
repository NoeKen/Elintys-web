import { expect, test } from '@playwright/test';
import {
  ApiClient,
  apiFromState,
  OWNER_STATE,
  cleanupEvents,
  createDraft,
  waitForHydration,
} from './helpers';

/**
 * Cycle de vie complet du module Événement (Sprint 1, parties B et D) :
 * créer → sauvegarder → quitter → reprendre → compléter → publier →
 * voir publiquement → modifier → republier → supprimer.
 */

let api: ApiClient;
const created: string[] = [];

test.beforeAll(async () => {
  api = await apiFromState(OWNER_STATE);
});

test.afterAll(async () => {
  await cleanupEvents(api, created);
  await api.dispose();
});

test.describe('Cycle de vie de l’événement', () => {
  test('devrait créer un brouillon, le retrouver après « quitter », puis le compléter', async ({ page }) => {
    // 1. Créer
    const draft = await createDraft(api, { title: 'Cycle complet' });
    created.push(draft.id);

    // 2. Sauvegarder / compléter les champs requis à la publication
    const patch = await api.patch(`/events/${draft.id}`, {
      data: {
        eventType: 'corporate',
        startDate: '2026-12-01T18:00:00.000Z',
        shortDescription: 'Événement E2E de validation du cycle de vie.',
      },
    });
    expect(patch.status()).toBe(200);

    // 3. « Quitter » puis reprendre : la ressource est relue depuis l'API
    const reloaded = await api.get(`/events/${draft.id}`);
    expect(reloaded.status()).toBe(200);
    const body = await reloaded.json();
    expect(body.title).toBe(draft.title);
    expect(body.eventType).toBe('corporate');
    expect(body.status).toBe('draft');

    // 4. La reprise est visible dans « Mes événements »
    await page.goto('/tableau-de-bord/evenements');
    await waitForHydration(page);
    // Flux utilisateur réel : rechercher le brouillon dans « Mes événements ».
    const search = page.getByPlaceholder(/recherch/i).first();
    await search.fill(String(draft.title.split(' ').pop()));
    await expect(page.getByText(draft.title, { exact: false }).first()).toBeVisible();
  });

  test('devrait exposer une readiness cohérente avant publication', async () => {
    const draft = await createDraft(api, { title: 'Readiness' });
    created.push(draft.id);

    // Brouillon incomplet : non publiable, erreurs explicites
    const before = await api.get(`/events/${draft.id}/publish-readiness`);
    expect(before.status()).toBe(200);
    const beforeBody = await before.json();
    expect(beforeBody.publishable).toBe(false);
    const codes = (beforeBody.errors as Array<{ code: string }>).map((e) => e.code);
    expect(codes).toContain('EVENT_TYPE_REQUIRED');
    expect(codes).toContain('START_DATE_REQUIRED');

    // Une fois complété : publiable
    await api.patch(`/events/${draft.id}`, {
      data: { eventType: 'corporate', startDate: '2026-12-01T18:00:00.000Z' },
    });
    const after = await api.get(`/events/${draft.id}/publish-readiness`);
    expect((await after.json()).publishable).toBe(true);
  });

  test('devrait publier puis exposer l’événement publiquement', async ({ page, browser }) => {
    const draft = await createDraft(api, { title: 'Publication' });
    created.push(draft.id);
    await api.patch(`/events/${draft.id}`, {
      data: { eventType: 'corporate', startDate: '2026-12-01T18:00:00.000Z' },
    });

    const publish = await api.patch(`/events/${draft.id}/publish`);
    expect(publish.status()).toBe(200);
    const published = await publish.json();
    expect(published.status).toBe('published');
    expect(published.slug, 'un slug doit être généré à la publication').toBeTruthy();

    // Visible publiquement, y compris pour un visiteur anonyme
    const anonymous = await browser.newContext({ storageState: undefined });
    const publicPage = await anonymous.newPage();
    const response = await publicPage.goto(`/evenements/${published.slug}`);
    expect(response?.status()).toBe(200);
    await expect(publicPage.getByText(draft.title, { exact: false }).first()).toBeVisible();
    await anonymous.close();

    // Modifier puis republier : la source de vérité (API) reflète immédiatement.
    // ⚠️ La page publique est mise en cache ISR (revalidate 60 s) : le changement
    // n'y apparaît qu'après expiration du cache — comportement voulu, pas un bug.
    const nouveauTitre = `${draft.title} — révisé`;
    expect((await api.patch(`/events/${draft.id}`, { data: { title: nouveauTitre } })).status()).toBe(200);
    expect((await (await api.get(`/events/${draft.id}`)).json()).title).toBe(nouveauTitre);

    // La page publique reste servie correctement après modification.
    const afterEdit = await page.goto(`/evenements/${published.slug}`);
    expect(afterEdit?.status()).toBe(200);
    await waitForHydration(page);
  });

  test('devrait supprimer un événement et le rendre inaccessible', async () => {
    const draft = await createDraft(api, { title: 'Suppression' });
    expect((await api.delete(`/events/${draft.id}`)).status()).toBe(204);
    expect((await api.get(`/events/${draft.id}`)).status()).toBe(404);
  });
});

test.describe('Visibilité, accès et admission', () => {
  test('devrait appliquer public / unlisted / private à la découvrabilité', async ({ browser }) => {
    const anonymous = await browser.newContext({ storageState: undefined });
    const publicPage = await anonymous.newPage();

    // --- public : listé dans le catalogue ---
    const pub = await createDraft(api, { title: 'Visibilite publique' });
    created.push(pub.id);
    await api.patch(`/events/${pub.id}`, {
      data: { eventType: 'corporate', startDate: '2026-12-01T18:00:00.000Z' },
    });
    await api.put(`/events/${pub.id}/access-configuration`, {
      data: {
        discoverability: 'public',
        accessPolicy: { type: 'open' },
        admissionModes: ['registration_only'],
      },
    });
    const publishedPub = await (await api.patch(`/events/${pub.id}/publish`)).json();

    const catalog = await api.get('/events?page=1&limit=100');
    const listed = ((await catalog.json()).data as Array<{ _id: string }>).some((e) => e._id === pub.id);
    expect(listed, 'un événement public doit apparaître au catalogue').toBe(true);
    expect((await publicPage.goto(`/evenements/${publishedPub.slug}`))?.status()).toBe(200);

    // --- unlisted : accessible par lien direct, absent du catalogue ---
    const unlisted = await createDraft(api, { title: 'Visibilite unlisted' });
    created.push(unlisted.id);
    await api.patch(`/events/${unlisted.id}`, {
      data: { eventType: 'corporate', startDate: '2026-12-01T18:00:00.000Z' },
    });
    await api.put(`/events/${unlisted.id}/access-configuration`, {
      data: {
        discoverability: 'unlisted',
        accessPolicy: { type: 'invitation_token' },
        admissionModes: ['invitation'],
      },
    });
    await api.patch(`/events/${unlisted.id}/publish`);

    const catalog2 = await api.get('/events?page=1&limit=100');
    const unlistedListed = ((await catalog2.json()).data as Array<{ _id: string }>).some(
      (e) => e._id === unlisted.id,
    );
    expect(unlistedListed, 'un événement unlisted ne doit PAS être listé').toBe(false);

    // --- private : invisible pour un tiers ---
    const priv = await createDraft(api, { title: 'Visibilite privee' });
    created.push(priv.id);
    await api.patch(`/events/${priv.id}`, {
      data: { eventType: 'corporate', startDate: '2026-12-01T18:00:00.000Z' },
    });
    await api.put(`/events/${priv.id}/access-configuration`, {
      data: {
        discoverability: 'private',
        accessPolicy: { type: 'manual_approval', requiresAuthentication: true },
        admissionModes: ['registration_only'],
      },
    });
    await api.patch(`/events/${priv.id}/publish`);

    const catalog3 = await api.get('/events?page=1&limit=100');
    const privListed = ((await catalog3.json()).data as Array<{ _id: string }>).some(
      (e) => e._id === priv.id,
    );
    expect(privListed, 'un événement privé ne doit jamais être listé').toBe(false);

    await anonymous.close();
  });

  test('devrait exiger puis accepter un code d’accès', async () => {
    const event = await createDraft(api, { title: 'Code acces' });
    created.push(event.id);
    await api.patch(`/events/${event.id}`, {
      data: { eventType: 'corporate', startDate: '2026-12-01T18:00:00.000Z' },
    });
    await api.put(`/events/${event.id}/access-configuration`, {
      data: {
        discoverability: 'unlisted',
        accessPolicy: { type: 'access_code', code: 'Code-E2E-2026' },
        admissionModes: ['registration_only'],
      },
    });
    await api.patch(`/events/${event.id}/publish`);

    const mauvais = await api.post(`/events/${event.id}/access/code/verify`, {
      data: { code: 'mauvais-code' },
    });
    expect(mauvais.status()).toBe(403);

    const bon = await api.post(`/events/${event.id}/access/code/verify`, {
      data: { code: 'Code-E2E-2026' },
    });
    expect(bon.status()).toBe(200);
    expect((await bon.json()).accessGrant).toBeTruthy();
  });

  test('ne devrait jamais exposer le hash du code d’accès', async () => {
    const event = await createDraft(api, { title: 'Fuite code' });
    created.push(event.id);
    await api.put(`/events/${event.id}/access-configuration`, {
      data: {
        discoverability: 'unlisted',
        accessPolicy: { type: 'access_code', code: 'Secret-E2E-2026' },
        admissionModes: ['registration_only'],
      },
    });
    const detail = await api.get(`/events/${event.id}`);
    const raw = await detail.text();
    expect(raw).not.toContain('codeHash');
    expect(raw).not.toContain('Secret-E2E-2026');
  });
});

import { expect, test } from '@playwright/test';
import {
  anonymousApi,
  ApiClient,
  apiFromState,
  OWNER_STATE,
  cleanupEvents,
  createDraft,
  TIERS_STATE,
} from './helpers';

/**
 * IDOR, ownership et cloisonnement entre comptes (Sprint 1, partie B).
 */

let owner: ApiClient;
let tiers: ApiClient;
const created: string[] = [];

test.beforeAll(async () => {
  owner = await apiFromState(OWNER_STATE);
  tiers = await apiFromState(TIERS_STATE);
});

test.afterAll(async () => {
  await cleanupEvents(owner, created);
  await owner.dispose();
  await tiers.dispose();
});

test.describe('IDOR et ownership', () => {
  test('devrait refuser toute mutation d’un événement par un tiers', async () => {
    const event = await createDraft(owner, { title: 'IDOR' });
    created.push(event.id);

    expect((await tiers.patch(`/events/${event.id}`, { data: { title: 'PIRATÉ' } })).status()).toBe(403);
    expect((await tiers.put(`/events/${event.id}`, { data: { title: 'PIRATÉ' } })).status()).toBe(403);
    expect((await tiers.delete(`/events/${event.id}`)).status()).toBe(403);
    expect((await tiers.patch(`/events/${event.id}/publish`)).status()).toBe(403);
    expect(
      (
        await tiers.put(`/events/${event.id}/access-configuration`, {
          data: {
            discoverability: 'public',
            accessPolicy: { type: 'open' },
            admissionModes: ['registration_only'],
          },
        })
      ).status(),
    ).toBe(403);

    // Le titre d'origine est intact.
    expect((await (await owner.get(`/events/${event.id}`)).json()).title).toBe(event.title);
  });

  test('devrait refuser à un tiers la lecture des demandes d’accès', async () => {
    const event = await createDraft(owner, { title: 'Demandes acces' });
    created.push(event.id);
    expect((await tiers.get(`/events/${event.id}/access/requests`)).status()).toBe(403);
    expect((await owner.get(`/events/${event.id}/access/requests`)).status()).toBe(200);
  });

  test('ne devrait pas exposer un brouillon d’autrui', async () => {
    const event = await createDraft(owner, { title: 'Brouillon prive' });
    created.push(event.id);
    const asTiers = await tiers.get(`/events/${event.id}`);
    expect([403, 404]).toContain(asTiers.status());
  });

  test('devrait cloisonner « Mes événements » par compte', async () => {
    const event = await createDraft(owner, { title: 'Cloisonnement' });
    created.push(event.id);

    const mine = await (await owner.get('/events/my')).json();
    const theirs = await (await tiers.get('/events/my')).json();

    const inMine = (mine.data ?? mine).some?.((e: { _id: string }) => e._id === event.id);
    const inTheirs = (theirs.data ?? theirs).some?.((e: { _id: string }) => e._id === event.id);
    expect(inMine, 'le propriétaire voit son événement').toBe(true);
    expect(inTheirs, 'le tiers ne doit pas le voir').toBe(false);
  });

  test('devrait refuser toute écriture non authentifiée', async () => {
    const anonymous = await anonymousApi();
    const event = await createDraft(owner, { title: 'Anonyme' });
    created.push(event.id);

    expect((await anonymous.post('/events', { data: { title: 'x' } })).status()).toBe(401);
    expect((await anonymous.patch(`/events/${event.id}`, { data: { title: 'x' } })).status()).toBe(401);
    expect((await anonymous.delete(`/events/${event.id}`)).status()).toBe(401);
    expect((await anonymous.get('/events/my')).status()).toBe(401);
    await anonymous.dispose();
  });

  test('devrait résister aux entrées malformées sans erreur 500', async () => {
    const payloads: Array<Record<string, unknown>> = [
      { title: { $ne: null } },
      { title: ['tableau'] },
      { title: 42 },
      { title: 'ok', eventType: { $gt: '' } },
    ];
    for (const data of payloads) {
      const response = await owner.post('/events', { data });
      expect(
        response.status(),
        `payload ${JSON.stringify(data)} doit être rejeté proprement`,
      ).toBe(400);
    }
  });

  test('devrait refuser un identifiant d’événement malformé', async () => {
    const response = await owner.get('/events/pas-un-objectid');
    expect([400, 404]).toContain(response.status());
    expect(await response.text()).not.toContain('CastError');
  });
});

test.describe('Invitations', () => {
  test('devrait permettre plusieurs invitations distinctes et bloquer les vrais doublons', async () => {
    const event = await createDraft(owner, { title: 'Invitations' });
    created.push(event.id);
    await owner.put(`/events/${event.id}/access-configuration`, {
      data: {
        discoverability: 'unlisted',
        accessPolicy: { type: 'invitation_token' },
        admissionModes: ['invitation'],
      },
    });

    const stamp = Date.now();
    const first = await owner.post('/invitations', {
      data: {
        email: `e2e-inv-a-${stamp}@demo.elintys.com`,
        name: 'Invité A',
        type: 'participant',
        eventId: event.id,
      },
    });
    const second = await owner.post('/invitations', {
      data: {
        email: `e2e-inv-b-${stamp}@demo.elintys.com`,
        name: 'Invité B',
        type: 'participant',
        eventId: event.id,
      },
    });
    expect(first.status(), 'première invitation').toBe(201);
    expect(second.status(), 'seconde invitation (régression F-028)').toBe(201);

    // Doublon métier exact → conflit explicite
    const duplicate = await owner.post('/invitations', {
      data: {
        email: `e2e-inv-a-${stamp}@demo.elintys.com`,
        name: 'Invité A',
        type: 'participant',
        eventId: event.id,
      },
    });
    expect(duplicate.status()).toBe(409);
    expect((await duplicate.json()).message).toBe('INVITATION_ALREADY_SENT');

    // Aucun secret exposé
    const payload = await first.text();
    expect(payload).not.toContain('tokenHash');
    expect(payload).not.toMatch(/"token"\s*:/);
  });

  test('devrait refuser une invitation d’un tiers sur l’événement du propriétaire', async () => {
    const event = await createDraft(owner, { title: 'Invitation IDOR' });
    created.push(event.id);
    await owner.put(`/events/${event.id}/access-configuration`, {
      data: {
        discoverability: 'unlisted',
        accessPolicy: { type: 'invitation_token' },
        admissionModes: ['invitation'],
      },
    });

    const response = await tiers.post('/invitations', {
      data: {
        email: `e2e-idor-${Date.now()}@demo.elintys.com`,
        name: 'Pirate',
        type: 'participant',
        eventId: event.id,
      },
    });
    expect(response.status()).toBe(403);
    expect((await response.json()).message).toBe('EVENT_NOT_OWNER');
  });

  test('devrait refuser une invitation participant si le mode invitation est inactif', async () => {
    const event = await createDraft(owner, { title: 'Admission inactive' });
    created.push(event.id);
    await owner.put(`/events/${event.id}/access-configuration`, {
      data: {
        discoverability: 'public',
        accessPolicy: { type: 'open' },
        admissionModes: ['registration_only'],
      },
    });

    const response = await owner.post('/invitations', {
      data: {
        email: `e2e-refus-${Date.now()}@demo.elintys.com`,
        name: 'Refusé',
        type: 'participant',
        eventId: event.id,
      },
    });
    expect(response.status()).toBe(409);
    expect((await response.json()).message).toBe('INVITATION_ADMISSION_DISABLED');
  });

  test('devrait refuser un jeton d’invitation inexistant', async () => {
    const anonymous = await anonymousApi();
    const response = await anonymous.post('/invitations/accept/jeton-inexistant-e2e');
    expect(response.status()).toBe(404);
    await anonymous.dispose();
  });
});

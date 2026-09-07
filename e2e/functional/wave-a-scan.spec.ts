import { expect, test } from '@playwright/test';
import type { ApiClient } from './helpers';
import {
  QA_TITLE_PREFIX,
  apiContextFor,
  ownerCredentials,
  secondaryCredentials,
} from './helpers';

/**
 * Parcours SCAN complet : achat d'un billet gratuit, admission, seconde
 * présentation, et refus d'un billet appartenant à un autre événement.
 *
 * Aucun test ne couvrait ce chemin : le scanner envoyait {eventId, qrCode} à
 * un DTO qui n'acceptait que qrCode, et chaque scan recevait 400.
 */
test.describe.configure({ mode: 'serial' });

let organizer: ApiClient;
let stranger: ApiClient;
const createdEvents: string[] = [];

test.beforeAll(async () => {
  // La connexion peut attendre la fenêtre du rate-limit lors d'un démarrage
  // à froid : le hook doit pouvoir dépasser le délai par défaut.
  test.setTimeout(180_000);
  organizer = await apiContextFor(ownerCredentials());
  stranger = await apiContextFor(secondaryCredentials());
});

test.afterAll(async () => {
  await Promise.all(
    createdEvents.map((id) => organizer.delete(`/events/${id}`).catch(() => undefined)),
  );
  await Promise.all([organizer?.dispose(), stranger?.dispose()]);
});

/** Événement publié avec un billet gratuit, acheté par l'organisateur. */
async function eventWithTicket(label: string): Promise<{ eventId: string; qrCode: string }> {
  const startDate = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const created = await organizer.post('/events', {
    data: {
      title: `${QA_TITLE_PREFIX} ${label} ${Date.now()}`,
      eventType: 'corporate',
      shortDescription: 'Parcours E2E vague A.',
      startDate,
      admissionModes: ['free_ticket'],
      discoverability: 'public',
      accessPolicy: { type: 'open' },
      location: { type: 'physical', name: 'Salle QA', address: '1 rue Test', city: 'Montréal' },
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const eventId = ((await created.json()) as { _id: string })._id;
  createdEvents.push(eventId);

  const ticketType = await organizer.post(`/ticket-types/events/${eventId}`, {
    data: { name: 'Billet gratuit', quantity: 5, isFree: true, price: 0 },
  });
  expect(ticketType.status(), await ticketType.text()).toBe(201);
  const ticketTypeId = ((await ticketType.json()) as { _id: string })._id;

  const purchase = await organizer.post('/tickets/purchase', {
    data: { ticketTypeId, quantity: 1 },
    headers: { 'Idempotency-Key': `${label}-${Date.now()}` },
  });
  expect(purchase.status(), await purchase.text()).toBe(201);
  const tickets = (await purchase.json()) as Array<{ qrCode: string }>;
  expect(tickets[0]?.qrCode).toBeTruthy();

  return { eventId, qrCode: tickets[0].qrCode };
}

test.describe('Vague A — scan de billets', () => {
  test('un billet valide est admis, puis signalé déjà utilisé', async () => {
    const { eventId, qrCode } = await eventWithTicket('Scan');

    // F-03 : le payload réellement envoyé par le scanner web.
    const first = await organizer.post('/tickets/scan', { data: { eventId, qrCode } });
    expect(first.status(), await first.text()).toBe(200);
    const admitted = (await first.json()) as { outcome: string };
    expect(admitted.outcome).toBe('admitted');

    const second = await organizer.post('/tickets/scan', { data: { eventId, qrCode } });
    expect(second.status()).toBe(200);
    expect(((await second.json()) as { outcome: string }).outcome).toBe('already_used');
  });

  test('deux scans SIMULTANÉS n’admettent qu’une seule fois', async () => {
    // F-15 : la séquence lecture → vérification → écriture laissait passer
    // deux admissions pour un seul billet.
    const { eventId, qrCode } = await eventWithTicket('Scan concurrent');

    const [a, b] = await Promise.all([
      organizer.post('/tickets/scan', { data: { eventId, qrCode } }),
      organizer.post('/tickets/scan', { data: { eventId, qrCode } }),
    ]);

    const outcomes = await Promise.all(
      [a, b].map(async (response) =>
        response.status() === 200 ? ((await response.json()) as { outcome: string }).outcome : 'error',
      ),
    );

    expect(outcomes.filter((outcome) => outcome === 'admitted')).toHaveLength(1);
  });

  test('un billet d’un AUTRE événement est refusé', async () => {
    const first = await eventWithTicket('Scan événement A');
    const second = await eventWithTicket('Scan événement B');

    const refused = await organizer.post('/tickets/scan', {
      data: { eventId: first.eventId, qrCode: second.qrCode },
    });

    // Indiscernable d'un code inconnu : on ne confirme pas l'existence d'un
    // billet appartenant à un autre événement.
    expect(refused.status()).toBe(404);

    // Le billet de l'événement B reste utilisable chez lui.
    const admitted = await organizer.post('/tickets/scan', {
      data: { eventId: second.eventId, qrCode: second.qrCode },
    });
    expect(admitted.status()).toBe(200);
  });

  test('un organisateur tiers ne peut pas scanner cet événement', async () => {
    const { eventId, qrCode } = await eventWithTicket('Scan ownership');

    const refused = await stranger.post('/tickets/scan', { data: { eventId, qrCode } });

    // §13 : le rôle ORGANISATEUR ne suffit pas, il faut gérer CET événement.
    expect(refused.status()).toBe(403);

    // Et le billet n'a pas été consommé au passage.
    const admitted = await organizer.post('/tickets/scan', { data: { eventId, qrCode } });
    expect(((await admitted.json()) as { outcome: string }).outcome).toBe('admitted');
  });

  test('un eventId absent ou malformé est refusé explicitement', async () => {
    const { qrCode } = await eventWithTicket('Scan contrat');

    const missing = await organizer.post('/tickets/scan', { data: { qrCode } });
    const malformed = await organizer.post('/tickets/scan', {
      data: { eventId: 'pas-un-objectid', qrCode },
    });

    expect(missing.status()).toBe(400);
    expect(malformed.status()).toBe(400);
  });
});

import { expect, test } from '@playwright/test';
import type { ApiClient } from './helpers';
import {
  QA_TITLE_PREFIX,
  apiContextFor,
  ownerCredentials,
  vendorCredentials,
  venueCredentials,
} from './helpers';

/**
 * Parcours métier COMPLETS des rôles prestataire et gestionnaire.
 *
 * L'audit a montré que ces deux rôles étaient inutilisables de bout en bout
 * sans qu'aucun test ne s'en aperçoive : les tests unitaires API validaient le
 * contrat côté serveur, jamais la jonction. Ces parcours traversent la boucle
 * entière — l'organisateur envoie, le destinataire répond, l'organisateur voit
 * le verdict — ce qu'aucun test unitaire ne peut faire.
 *
 * Les connexions sont sérialisées et faites UNE fois par rôle : le tier
 * AUTH_STRICT plafonne à 5 tentatives par minute et par IP.
 */
test.describe.configure({ mode: 'serial' });

let organizer: ApiClient;
let vendor: ApiClient;
let venue: ApiClient;
const createdEvents: string[] = [];

test.beforeAll(async () => {
  organizer = await apiContextFor(ownerCredentials());
  vendor = await apiContextFor(vendorCredentials());
  venue = await apiContextFor(venueCredentials());
});

test.afterAll(async () => {
  await Promise.all(
    createdEvents.map((id) => organizer.delete(`/events/${id}`).catch(() => undefined)),
  );
  await Promise.all([organizer.dispose(), vendor.dispose(), venue.dispose()]);
});

async function createEvent(title: string): Promise<string> {
  const response = await organizer.post('/events', {
    data: { title: `${QA_TITLE_PREFIX} ${title} ${Date.now()}` },
  });
  expect(response.status(), await response.text()).toBe(201);
  const body = (await response.json()) as { _id: string };
  createdEvents.push(body._id);
  return body._id;
}

/** Garantit que le compte prestataire possède un profil (créé si absent). */
async function ensureVendorProfile(): Promise<string> {
  const existing = await vendor.get('/vendors/me');
  if (existing.status() === 200) {
    return ((await existing.json()) as { _id: string })._id;
  }
  expect(existing.status(), 'un compte sans profil doit répondre 404 métier').toBe(404);

  const created = await vendor.post('/vendors', {
    data: {
      businessName: `${QA_TITLE_PREFIX} Prestataire`,
      category: 'photographe',
      serviceArea: 'Montréal',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { _id: string })._id;
}

async function ensureVenueProfile(): Promise<string> {
  const existing = await venue.get('/venues/me');
  if (existing.status() === 200) {
    return ((await existing.json()) as { _id: string })._id;
  }
  expect(existing.status(), 'un compte sans fiche doit répondre 404 métier').toBe(404);

  const created = await venue.post('/venues', {
    data: {
      name: `${QA_TITLE_PREFIX} Salle`,
      capacity: 120,
      address: { street: '1 rue Test', city: 'Montréal' },
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { _id: string })._id;
}

test.describe('Vague A — parcours prestataire', () => {
  test('profil créé puis mis à jour via la route /me', async () => {
    const profileId = await ensureVendorProfile();

    // F-04 : PUT /vendors/me était capté par PUT /vendors/:id avec id="me"
    // et produisait un CastError Mongoose remonté en 500.
    const updated = await vendor.put('/vendors/me', {
      data: { serviceArea: 'Grand Montréal' },
    });
    expect(updated.status(), await updated.text()).toBe(200);
    const body = (await updated.json()) as { _id: string; serviceArea: string };
    expect(body._id).toBe(profileId);
    expect(body.serviceArea).toBe('Grand Montréal');
  });

  test('une catégorie hors énumération est refusée avec un message exploitable', async () => {
    await ensureVendorProfile();

    const refused = await vendor.put('/vendors/me', {
      data: { category: 'Photographie libre' },
    });

    // F-12 : le formulaire proposait une saisie libre, jamais acceptable ici.
    expect(refused.status()).toBe(400);
    expect(await refused.text()).toContain('category');
  });

  test('boucle complète : demande envoyée, acceptée, verdict visible côté organisateur', async () => {
    const vendorProfileId = await ensureVendorProfile();
    const eventId = await createEvent('Boucle prestataire');

    const sent = await organizer.post(`/vendors/${eventId}/requests`, {
      data: { vendorId: vendorProfileId, source: 'platform', message: 'Disponible ?' },
    });
    expect(sent.status(), await sent.text()).toBe(201);
    const requestId = ((await sent.json()) as { _id: string })._id;

    const mine = await vendor.get('/vendors/requests/my');
    expect(mine.status()).toBe(200);
    const requests = (await mine.json()) as Array<{
      _id: string;
      organizer: { fullName?: string } | string;
    }>;
    const received = requests.find((request) => request._id === requestId);
    expect(received, 'la demande doit être visible côté prestataire').toBeDefined();
    // F-13 : `organizer` doit être peuplé et porter `fullName`.
    expect(typeof received?.organizer === 'object' && received?.organizer.fullName).toBeTruthy();

    // F-02 : PATCH + responseMessage. Le client web utilisait PUT + message,
    // ce qui donnait 404 puis 400.
    const accepted = await vendor.patch(`/vendors/requests/${requestId}/respond`, {
      data: { status: 'accepted', responseMessage: 'Avec plaisir' },
    });
    expect(accepted.status(), await accepted.text()).toBe(200);

    const asOrganizer = await organizer.get(`/vendors/${eventId}/requests`);
    const organizerView = (await asOrganizer.json()) as Array<{ _id: string; status: string }>;
    expect(organizerView.find((request) => request._id === requestId)?.status).toBe('accepted');
  });

  test('une demande déjà tranchée ne peut pas l’être une seconde fois', async () => {
    const vendorProfileId = await ensureVendorProfile();
    const eventId = await createEvent('Double réponse');

    const sent = await organizer.post(`/vendors/${eventId}/requests`, {
      data: { vendorId: vendorProfileId, source: 'platform' },
    });
    const requestId = ((await sent.json()) as { _id: string })._id;

    const first = await vendor.patch(`/vendors/requests/${requestId}/respond`, {
      data: { status: 'accepted' },
    });
    const second = await vendor.patch(`/vendors/requests/${requestId}/respond`, {
      data: { status: 'declined' },
    });

    expect(first.status()).toBe(200);
    // F-16 : le perdant reçoit un conflit stable, pas un second succès.
    expect(second.status()).toBe(409);
  });

  test('un refus est enregistré et visible', async () => {
    const vendorProfileId = await ensureVendorProfile();
    const eventId = await createEvent('Refus prestataire');

    const sent = await organizer.post(`/vendors/${eventId}/requests`, {
      data: { vendorId: vendorProfileId, source: 'platform' },
    });
    const requestId = ((await sent.json()) as { _id: string })._id;

    const declined = await vendor.patch(`/vendors/requests/${requestId}/respond`, {
      data: { status: 'declined', responseMessage: 'Indisponible' },
    });

    expect(declined.status()).toBe(200);
    expect(((await declined.json()) as { status: string }).status).toBe('declined');
  });
});

test.describe('Vague A — parcours gestionnaire de lieu', () => {
  test('fiche créée puis mise à jour via la route /me', async () => {
    const venueId = await ensureVenueProfile();

    const updated = await venue.put('/venues/me', { data: { capacity: 180 } });
    expect(updated.status(), await updated.text()).toBe(200);
    const body = (await updated.json()) as { _id: string; capacity: number };
    expect(body._id).toBe(venueId);
    expect(body.capacity).toBe(180);
  });

  test('boucle complète : réservation demandée, confirmée, verdict visible côté organisateur', async () => {
    const venueId = await ensureVenueProfile();
    const eventId = await createEvent('Boucle lieu');

    const requested = await organizer.post(`/venues/${eventId}/bookings`, {
      data: {
        venueId,
        bookingStart: new Date(Date.now() + 86_400_000).toISOString(),
        bookingEnd: new Date(Date.now() + 172_800_000).toISOString(),
        message: 'Disponible ?',
      },
    });
    expect(requested.status(), await requested.text()).toBe(201);
    const bookingId = ((await requested.json()) as { _id: string })._id;

    const mine = await venue.get('/venues/bookings/my');
    const bookings = (await mine.json()) as Array<{
      _id: string;
      organizer: { fullName?: string } | string;
    }>;
    const received = bookings.find((booking) => booking._id === bookingId);
    expect(received).toBeDefined();
    expect(typeof received?.organizer === 'object' && received?.organizer.fullName).toBeTruthy();

    const confirmed = await venue.patch(`/venues/bookings/${bookingId}/respond`, {
      data: { status: 'confirmed', responseMessage: 'Salle réservée' },
    });
    expect(confirmed.status(), await confirmed.text()).toBe(200);

    const asOrganizer = await organizer.get(`/venues/${eventId}/bookings`);
    const organizerView = (await asOrganizer.json()) as Array<{ _id: string; status: string }>;
    expect(organizerView.find((booking) => booking._id === bookingId)?.status).toBe('confirmed');
  });

  test('une réservation déjà tranchée ne peut pas l’être une seconde fois', async () => {
    const venueId = await ensureVenueProfile();
    const eventId = await createEvent('Double réponse lieu');

    const requested = await organizer.post(`/venues/${eventId}/bookings`, {
      data: {
        venueId,
        bookingStart: new Date(Date.now() + 86_400_000).toISOString(),
        bookingEnd: new Date(Date.now() + 172_800_000).toISOString(),
      },
    });
    const bookingId = ((await requested.json()) as { _id: string })._id;

    const first = await venue.patch(`/venues/bookings/${bookingId}/respond`, {
      data: { status: 'confirmed' },
    });
    const second = await venue.patch(`/venues/bookings/${bookingId}/respond`, {
      data: { status: 'refused' },
    });

    expect(first.status()).toBe(200);
    expect(second.status()).toBe(409);
  });

  test('un gestionnaire ne peut pas répondre à la réservation d’un autre lieu', async () => {
    const venueId = await ensureVenueProfile();
    const eventId = await createEvent('Ownership lieu');

    const requested = await organizer.post(`/venues/${eventId}/bookings`, {
      data: {
        venueId,
        bookingStart: new Date(Date.now() + 86_400_000).toISOString(),
        bookingEnd: new Date(Date.now() + 172_800_000).toISOString(),
      },
    });
    const bookingId = ((await requested.json()) as { _id: string })._id;

    // L'organisateur n'a pas de fiche lieu : il ne peut pas répondre.
    const refused = await organizer.patch(`/venues/bookings/${bookingId}/respond`, {
      data: { status: 'confirmed' },
    });

    expect([403, 404]).toContain(refused.status());
  });
});

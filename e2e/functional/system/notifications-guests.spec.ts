import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  QA_TITLE_PREFIX,
  apiContextFor,
  ownerCredentials,
  vendorCredentials,
  venueCredentials,
  waitForHydration,
  type ApiClient,
} from '../helpers';

let organizer: ApiClient;
let vendor: ApiClient;
let venue: ApiClient;
const createdEvents: string[] = [];

async function createEvent(label: string): Promise<string> {
  const response = await organizer.post('/events', {
    data: { title: `${QA_TITLE_PREFIX} Wave E ${label} ${Date.now()}` },
  });
  expect(response.status(), await response.text()).toBe(201);
  const eventId = ((await response.json()) as { _id: string })._id;
  createdEvents.push(eventId);
  return eventId;
}

async function ensureVendorProfile(): Promise<string> {
  const existing = await vendor.get('/vendors/me');
  if (existing.status() === 200) {
    return ((await existing.json()) as { _id: string })._id;
  }
  expect(existing.status()).toBe(404);
  const created = await vendor.post('/vendors', {
    data: {
      businessName: `${QA_TITLE_PREFIX} Prestataire Wave E`,
      category: 'photographe',
      serviceArea: 'Montréal',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { _id: string })._id;
}

async function createVendorNotification(label: string): Promise<{ eventId: string; requestId: string }> {
  const vendorId = await ensureVendorProfile();
  const eventId = await createEvent(label);
  const sent = await organizer.post(`/vendors/${eventId}/requests`, {
    data: { vendorId, source: 'platform', message: 'Demande système Wave E' },
  });
  expect(sent.status(), await sent.text()).toBe(201);
  return { eventId, requestId: ((await sent.json()) as { _id: string })._id };
}

async function ensureVenueProfile(): Promise<string> {
  const existing = await venue.get('/venues/me');
  if (existing.status() === 200) return ((await existing.json()) as { _id: string })._id;
  expect(existing.status()).toBe(404);
  const created = await venue.post('/venues', {
    data: {
      name: `${QA_TITLE_PREFIX} Salle Wave F`,
      capacity: 120,
      address: { street: '1 rue Test', city: 'Montréal' },
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { _id: string })._id;
}

async function userPage(
  browser: Browser,
  client: ApiClient,
): Promise<{ page: Page; close: () => Promise<void> }> {
  const refreshed = await client.post('/auth/refresh');
  expect(refreshed.status(), await refreshed.text()).toBe(200);
  const context = await browser.newContext({ storageState: await client.storageState() });
  return { page: await context.newPage(), close: () => context.close() };
}

async function clearNotifications(client: ApiClient): Promise<void> {
  const response = await client.patch('/notifications/read-all');
  expect(response.status()).toBe(204);
}

async function findUnread(
  client: ApiClient,
  type: string,
): Promise<{ _id: string; type: string; payload: Record<string, unknown>; read: boolean }> {
  let found: { _id: string; type: string; payload: Record<string, unknown>; read: boolean } | undefined;
  await expect.poll(async () => {
    const response = await client.get('/notifications/me?unreadOnly=true&page=1');
    if (!response.ok()) return false;
    const items = await response.json() as Array<{
      _id: string;
      type: string;
      payload: Record<string, unknown>;
      read: boolean;
    }>;
    found = items.find((item) => item.type === type);
    return Boolean(found);
  }).toBe(true);
  if (!found) throw new Error(`Notification ${type} introuvable après attente`);
  return found;
}

test.beforeAll(async () => {
  test.setTimeout(180_000);
  organizer = await apiContextFor(ownerCredentials());
  vendor = await apiContextFor(vendorCredentials());
  venue = await apiContextFor(venueCredentials());
});

test.afterAll(async () => {
  await Promise.all(
    createdEvents.map((id) => organizer.delete(`/events/${id}`).catch(() => undefined)),
  );
  await Promise.all([organizer?.dispose(), vendor?.dispose(), venue?.dispose()]);
});

test('Guests : CRUD réel, pagination bornée et isolation cross-event', async () => {
  const eventA = await createEvent('Guests A');
  const eventB = await createEvent('Guests B');

  const createdA = await organizer.post(`/events/${eventA}/guests`, {
    data: { name: 'Invité Wave E A', email: `wave-e-a-${Date.now()}@example.com` },
  });
  const createdB = await organizer.post(`/events/${eventB}/guests`, {
    data: { name: 'Invité Wave E B', email: `wave-e-b-${Date.now()}@example.com` },
  });
  expect(createdA.status(), await createdA.text()).toBe(201);
  expect(createdB.status(), await createdB.text()).toBe(201);
  const guestA = ((await createdA.json()) as { _id: string })._id;
  const guestB = ((await createdB.json()) as { _id: string })._id;

  const crossEvent = await organizer.put(`/events/${eventA}/guests/${guestB}`, {
    data: { status: 'present' },
  });
  expect(crossEvent.status()).toBe(404);

  const updated = await organizer.put(`/events/${eventA}/guests/${guestA}`, {
    data: { status: 'confirmed' },
  });
  expect(updated.status(), await updated.text()).toBe(200);

  const list = await organizer.get(`/events/${eventA}/guests?page=1&limit=25`);
  expect(list.status()).toBe(200);
  const body = await list.json() as { data: Array<{ _id: string; status: string }>; total: number };
  expect(body.data).toEqual(expect.arrayContaining([
    expect.objectContaining({ _id: guestA, status: 'confirmed' }),
  ]));
  expect(body.data.some(({ _id }) => _id === guestB)).toBe(false);

  const removed = await organizer.delete(`/events/${eventA}/guests/${guestA}`);
  expect(removed.status()).toBe(204);
  const afterDelete = await organizer.get(`/events/${eventA}/guests?page=1&limit=25`);
  expect(((await afterDelete.json()) as { data: Array<{ _id: string }> }).data)
    .not.toEqual(expect.arrayContaining([expect.objectContaining({ _id: guestA })]));
});

test('Notifications : création métier, lecture individuelle, Tout marquer lu et persistance UI', async ({ browser }) => {
  await clearNotifications(vendor);
  const { eventId } = await createVendorNotification('Notification A');
  await createVendorNotification('Notification B');

  await expect.poll(async () => {
    const response = await vendor.get('/notifications/me/unread-count');
    if (!response.ok()) return -1;
    return ((await response.json()) as { count: number }).count;
  }).toBeGreaterThanOrEqual(2);

  const unread = await vendor.get('/notifications/me?unreadOnly=true&page=1');
  expect(unread.status()).toBe(200);
  const notifications = await unread.json() as Array<{ _id: string; type: string; read: boolean }>;
  expect(notifications).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'VENDOR_REQUEST_RECEIVED', read: false }),
  ]));

  const { page, close } = await userPage(browser, vendor);
  try {
    await page.goto('/tableau-de-bord/prestataire/demandes');
    await waitForHydration(page);
    const bells = page.getByRole('button', { name: 'Notifications' });
    await expect(bells).toHaveCount(1);
    const bell = bells.first();
    await expect(bell).toBeVisible();
    await bell.click();
    const notification = page.getByRole('button', { name: /Nouvelle demande prestataire/ }).first();
    await expect(notification).toBeVisible();

    const markOneResponse = page.waitForResponse((response) =>
      response.url().includes('/notifications/')
        && response.url().endsWith('/read')
        && response.request().method() === 'PATCH',
    );
    await notification.click();
    expect((await markOneResponse).status()).toBe(204);
    await expect(page).toHaveURL('/tableau-de-bord/prestataire/demandes');

    await bell.click();

    const markAllResponse = page.waitForResponse((response) =>
      response.url().includes('/notifications/read-all') && response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Tout marquer lu' }).click();
    expect((await markAllResponse).status()).toBe(204);

    await expect.poll(async () => {
      const response = await vendor.get('/notifications/me/unread-count');
      return ((await response.json()) as { count: number }).count;
    }).toBe(0);

    await page.reload();
    await waitForHydration(page);
    await expect(page.getByRole('button', { name: 'Notifications' }).first().locator('span'))
      .toHaveCount(0);
    expect(eventId).toMatch(/^[a-f\d]{24}$/i);
  } finally {
    await close();
  }
});

test('Notifications : un 503 affiche un état réessayable, jamais un faux vide', async ({ browser }) => {
  await createVendorNotification('Notification dégradée');
  const { page, close } = await userPage(browser, vendor);
  let serviceUnavailable = true;
  try {
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      const isNotificationList =
        route.request().method() === 'GET' && url.pathname.endsWith('/notifications/me');
      if (serviceUnavailable && isNotificationList) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"indisponible"}' });
        return;
      }
      await route.continue();
    });
    await page.goto('/tableau-de-bord/prestataire/demandes');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Notifications' }).first().click();
    await expect(page.getByText('Les notifications sont temporairement indisponibles.')).toBeVisible();
    await expect(page.getByText('Aucune notification.')).toHaveCount(0);
    serviceUnavailable = false;
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByText('Nouvelle demande prestataire').first()).toBeVisible();
  } finally {
    await close();
  }
});

test('Notifications : réponse prestataire visible par l’organisateur avec deep link workspace', async ({ browser }) => {
  await clearNotifications(organizer);
  const { eventId, requestId } = await createVendorNotification('Réponse prestataire');
  const response = await vendor.patch(`/vendors/requests/${requestId}/respond`, {
    data: { status: 'accepted', responseMessage: 'Disponible' },
  });
  expect(response.status(), await response.text()).toBe(200);
  const created = await findUnread(organizer, 'VENDOR_RESPONDED');
  expect(created.payload).toMatchObject({ eventId, requestId, status: 'accepted' });

  const { page, close } = await userPage(browser, organizer);
  try {
    await page.goto('/tableau-de-bord');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Notifications' }).click();
    await page.getByRole('button', { name: /Réponse prestataire/ }).first().click();
    await expect(page).toHaveURL(`/tableau-de-bord/evenements/${eventId}/prestataires`);
  } finally {
    await close();
  }
});

test('Notifications : demande et réponse de lieu traversent les deux rôles', async ({ browser }) => {
  await Promise.all([clearNotifications(organizer), clearNotifications(venue)]);
  const venueId = await ensureVenueProfile();
  const eventId = await createEvent('Notifications lieu');
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
  const received = await findUnread(venue, 'VENUE_BOOKING_RECEIVED');
  expect(received.payload).toMatchObject({ bookingId, eventId });

  const managerBrowser = await userPage(browser, venue);
  try {
    await managerBrowser.page.goto('/tableau-de-bord/gestionnaire/reservations');
    await waitForHydration(managerBrowser.page);
    await managerBrowser.page.getByRole('button', { name: 'Notifications' }).click();
    await managerBrowser.page
      .getByRole('button', { name: /Nouvelle demande de réservation/ })
      .first()
      .click();
    await expect(managerBrowser.page).toHaveURL('/tableau-de-bord/gestionnaire/reservations');
  } finally {
    await managerBrowser.close();
  }

  const responded = await venue.patch(`/venues/bookings/${bookingId}/respond`, {
    data: { status: 'confirmed', responseMessage: 'Salle disponible' },
  });
  expect(responded.status(), await responded.text()).toBe(200);
  const organizerNotification = await findUnread(organizer, 'VENUE_CONFIRMED');
  expect(organizerNotification.payload).toMatchObject({ bookingId, eventId, status: 'confirmed' });

  const organizerBrowser = await userPage(browser, organizer);
  try {
    await organizerBrowser.page.goto('/tableau-de-bord');
    await waitForHydration(organizerBrowser.page);
    await organizerBrowser.page.getByRole('button', { name: 'Notifications' }).click();
    await organizerBrowser.page.getByRole('button', { name: /Réponse du lieu/ }).first().click();
    await expect(organizerBrowser.page).toHaveURL(
      `/tableau-de-bord/evenements/${eventId}/lieux`,
    );
  } finally {
    await organizerBrowser.close();
  }
});

test('Notifications : une notification ne peut jamais être marquée lue par un autre compte', async () => {
  await clearNotifications(vendor);
  await createVendorNotification('Ownership notification');
  const notification = await findUnread(vendor, 'VENDOR_REQUEST_RECEIVED');

  const crossUser = await organizer.patch(`/notifications/${notification._id}/read`);
  expect(crossUser.status()).toBe(404);

  const stillUnread = await vendor.get('/notifications/me?unreadOnly=true&page=1');
  const items = await stillUnread.json() as Array<{ _id: string }>;
  expect(items.some(({ _id }) => _id === notification._id)).toBe(true);
});

test('Notifications : une cible supprimée se dégrade en 404 sans fuite de contexte', async ({ browser }) => {
  await clearNotifications(organizer);
  const { eventId, requestId } = await createVendorNotification('Cible supprimée');
  const responded = await vendor.patch(`/vendors/requests/${requestId}/respond`, {
    data: { status: 'accepted' },
  });
  expect(responded.status(), await responded.text()).toBe(200);
  await findUnread(organizer, 'VENDOR_RESPONDED');

  const removed = await organizer.delete(`/events/${eventId}`);
  expect(removed.status()).toBe(204);

  const { page, close } = await userPage(browser, organizer);
  try {
    await page.goto('/tableau-de-bord');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Notifications' }).click();
    await page.getByRole('button', { name: /Réponse prestataire/ }).first().click();
    await expect(page).toHaveURL(`/tableau-de-bord/evenements/${eventId}/prestataires`);
    await expect(page.getByRole('alert').filter({ hasText: /introuvable/i })).toBeVisible();
    await expect(page.getByText(/Cible supprimée/)).toHaveCount(0);
  } finally {
    await close();
  }
});

const NOTIFICATION_VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1538, height: 1100 },
] as const;

for (const viewport of NOTIFICATION_VIEWPORTS) {
  test(`Notifications : panneau utilisable à ${viewport.width}×${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({
      storageState: await vendor.storageState(),
      viewport,
    });
    const page = await context.newPage();
    try {
      await page.goto('/tableau-de-bord/prestataire/demandes');
      await waitForHydration(page);
      const bell = page.getByRole('button', { name: /Notifications/ });
      const bellBox = await bell.boundingBox();
      expect(bellBox?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(bellBox?.height ?? 0).toBeGreaterThanOrEqual(44);
      await bell.click();

      const panel = page.getByRole('dialog', { name: 'Notifications' });
      await expect(panel).toBeVisible();
      const panelBox = await panel.boundingBox();
      expect(panelBox?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((panelBox?.x ?? 0) + (panelBox?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
        .toBeLessThanOrEqual(1);

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        violations.filter(({ impact }) => impact === 'critical' || impact === 'serious'),
      ).toEqual([]);

      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
      await expect(bell).toBeFocused();
    } finally {
      await context.close();
    }
  });
}

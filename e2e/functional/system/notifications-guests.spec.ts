import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  QA_TITLE_PREFIX,
  apiContextFor,
  ownerCredentials,
  vendorCredentials,
  waitForHydration,
  type ApiClient,
} from '../helpers';

let organizer: ApiClient;
let vendor: ApiClient;
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

async function createVendorNotification(label: string): Promise<void> {
  const vendorId = await ensureVendorProfile();
  const eventId = await createEvent(label);
  const sent = await organizer.post(`/vendors/${eventId}/requests`, {
    data: { vendorId, source: 'platform', message: 'Demande système Wave E' },
  });
  expect(sent.status(), await sent.text()).toBe(201);
}

async function vendorPage(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ storageState: await vendor.storageState() });
  return { page: await context.newPage(), close: () => context.close() };
}

test.beforeAll(async () => {
  test.setTimeout(180_000);
  organizer = await apiContextFor(ownerCredentials());
  vendor = await apiContextFor(vendorCredentials());
});

test.afterAll(async () => {
  await Promise.all(
    createdEvents.map((id) => organizer.delete(`/events/${id}`).catch(() => undefined)),
  );
  await Promise.all([organizer?.dispose(), vendor?.dispose()]);
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
  await createVendorNotification('Notification A');
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

  const markOne = await vendor.patch(`/notifications/${notifications[0]._id}/read`);
  expect(markOne.status()).toBe(204);

  const { page, close } = await vendorPage(browser);
  try {
    await page.goto('/tableau-de-bord/prestataire/demandes');
    await waitForHydration(page);
    const bell = page.getByRole('button', { name: 'Notifications' }).first();
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(page.getByText('Nouvelle demande').first()).toBeVisible();

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
  } finally {
    await close();
  }
});

test('Notifications : un 503 affiche un état réessayable, jamais un faux vide', async ({ browser }) => {
  await createVendorNotification('Notification dégradée');
  const { page, close } = await vendorPage(browser);
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
    await expect(page.getByText('Nouvelle demande').first()).toBeVisible();
  } finally {
    await close();
  }
});

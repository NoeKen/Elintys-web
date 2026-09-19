import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  accountCredentials,
  apiContextFor,
  apiFromState,
  cleanupEvents,
  createDraft,
  OWNER_STATE,
  TIERS_STATE,
  type ApiClient,
} from './helpers';

let owner: ApiClient;
let otherOrganizer: ApiClient;
let participant: ApiClient;
const created: string[] = [];
const marker = `Wave-I-${Date.now()}`;
let responsiveEvent: { id: string; title: string; slug: string };

async function publishEvent(label: string) {
  const draft = await createDraft(owner, { title: `${marker}-${label}` });
  created.push(draft.id);
  const update = await owner.patch(`/events/${draft.id}`, {
    data: {
      eventType: 'gala',
      shortDescription: 'Validation E2E du cycle de vie opérationnel.',
      startDate: '2027-05-15T18:00:00.000Z',
      endDate: '2027-05-15T22:00:00.000Z',
    },
  });
  expect(update.status(), await update.text()).toBe(200);
  const publish = await owner.patch(`/events/${draft.id}/publish`);
  expect(publish.status(), await publish.text()).toBe(200);
  const body = await publish.json() as { slug: string; status: string };
  expect(body.status).toBe('published');
  return { id: draft.id, title: draft.title, slug: body.slug };
}

function expectNoHorizontalOverflow(page: Page) {
  return expect.poll(() =>
    page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

test.beforeAll(async () => {
  owner = await apiFromState(OWNER_STATE);
  otherOrganizer = await apiFromState(TIERS_STATE);
  participant = await apiContextFor(accountCredentials());
  responsiveEvent = await publishEvent('responsive');
});

test.afterAll(async () => {
  await cleanupEvents(owner, created);
  await owner.dispose();
  await otherOrganizer.dispose();
  await participant.dispose();
});

test.describe('Wave I — opérations du cycle de vie Event', () => {
  test('supprime un brouillon depuis l’interface après confirmation explicite', async ({ page }) => {
    const draft = await createDraft(owner, { title: `${marker}-delete` });

    await page.goto(`/tableau-de-bord/evenements/${draft.id}/parametres`);
    await expect(page.getByRole('heading', { name: 'Paramètres' })).toBeVisible();
    await page.getByRole('button', { name: /Supprimer définitivement/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(draft.title);
    const confirm = dialog.getByLabel(/Je confirme vouloir supprimer/);
    await confirm.check();

    const deletion = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/events/${draft.id}`) &&
      response.request().method() === 'DELETE',
    );
    await dialog.getByRole('button', { name: 'Supprimer définitivement' }).click();
    expect((await deletion).status()).toBe(204);
    await expect(page).toHaveURL(/\/tableau-de-bord\/evenements$/);
    expect((await owner.get(`/events/${draft.id}`)).status()).toBe(404);
  });

  test('annule un événement publié et synchronise workspace, public et Search', async ({ page }) => {
    const event = await publishEvent('cancel');

    await page.goto(`/tableau-de-bord/evenements/${event.id}/parametres`);
    await page.getByRole('button', { name: /Annuler l['’]événement/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Aucun remboursement');

    const cancellation = page.waitForResponse((response) =>
      response.url().endsWith(`/api/v1/events/${event.id}/cancel`) &&
      response.request().method() === 'PATCH',
    );
    await dialog.getByRole('button', { name: 'Annuler l’événement' }).click();
    expect((await cancellation).status()).toBe(200);
    await expect(page.getByText('Annulé', { exact: true }).first()).toBeVisible();

    const managed = await owner.get(`/events/${event.id}`);
    expect((await managed.json()).status).toBe('cancelled');
    expect((await owner.get(`/events/slug/${event.slug}`)).status()).toBe(404);

    // Search est une lecture publique. Le compte tiers possède un bucket de
    // throttling distinct du propriétaire utilisé par les autres parcours.
    const discovery = await otherOrganizer.get(
      `/discovery/search?q=${encodeURIComponent(event.title)}&limit=12`,
    );
    expect(discovery.status()).toBe(200);
    const body = await discovery.json() as { events: Array<{ _id: string }> };
    expect(body.events.map((item) => item._id)).not.toContain(event.id);

    await page.goto(`/tableau-de-bord/evenements/${event.id}/informations`);
    await expect(page.getByText('Consultation uniquement')).toBeVisible();
    await expect(page.locator('[inert] button[type="submit"]')).toHaveCount(1);
  });

  test('informe une personne inscrite après l’annulation et ferme l’admission', async () => {
    const event = await publishEvent('participant-notification');
    const registration = await participant.post('/event-registrations', {
      data: { eventId: event.id },
      headers: { 'Idempotency-Key': `${marker}-registration` },
    });
    expect(registration.status(), await registration.text()).toBe(201);

    expect((await owner.patch(`/events/${event.id}/cancel`)).status()).toBe(200);

    const notifications = await participant.get('/notifications/me?page=1');
    expect(notifications.status()).toBe(200);
    const rows = await notifications.json() as Array<{
      type: string;
      payload: { eventId?: string };
    }>;
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'EVENT_CANCELLED',
        payload: expect.objectContaining({ eventId: event.id }),
      }),
    ]));

    const nextRegistration = await participant.post('/event-registrations', {
      data: { eventId: event.id },
      headers: { 'Idempotency-Key': `${marker}-registration-after-cancel` },
    });
    expect([400, 404, 409]).toContain(nextRegistration.status());
    expect((await (await owner.get(`/events/${event.id}`)).json()).status).toBe('cancelled');
  });

  test('refuse l’admission QR après l’annulation d’un événement gratuit', async () => {
    const draft = await createDraft(owner, { title: `${marker}-cancelled-qr` });
    created.push(draft.id);
    expect((await owner.patch(`/events/${draft.id}`, {
      data: {
        eventType: 'gala',
        shortDescription: 'Validation du verrouillage de l’admission après annulation.',
        startDate: '2027-06-15T18:00:00.000Z',
        endDate: '2027-06-15T22:00:00.000Z',
      },
    })).status()).toBe(200);
    expect((await owner.put(`/events/${draft.id}/access-configuration`, {
      data: {
        discoverability: 'public',
        accessPolicy: { type: 'open' },
        admissionModes: ['free_ticket'],
      },
    })).status()).toBe(200);
    const ticketType = await owner.post(`/ticket-types/events/${draft.id}`, {
      data: { name: 'Billet gratuit', quantity: 2, isFree: true, price: 0 },
    });
    expect(ticketType.status(), await ticketType.text()).toBe(201);
    const ticketTypeId = ((await ticketType.json()) as { _id: string })._id;
    expect((await owner.patch(`/events/${draft.id}/publish`)).status()).toBe(200);
    const purchase = await participant.post('/tickets/purchase', {
      data: { ticketTypeId, quantity: 1 },
      headers: { 'Idempotency-Key': `${marker}-free-ticket` },
    });
    expect(purchase.status(), await purchase.text()).toBe(201);
    const [{ qrCode }] = await purchase.json() as Array<{ qrCode: string }>;

    expect((await owner.patch(`/events/${draft.id}/cancel`)).status()).toBe(200);
    const scan = await owner.post('/tickets/scan', {
      data: { eventId: draft.id, qrCode },
    });
    expect(scan.status()).toBe(409);
  });

  test('refuse suppression, annulation et modification par un autre organisateur', async () => {
    const event = await publishEvent('idor');

    expect((await otherOrganizer.delete(`/events/${event.id}`)).status()).toBe(403);
    expect((await otherOrganizer.patch(`/events/${event.id}/cancel`)).status()).toBe(403);
    expect(
      (await otherOrganizer.patch(`/events/${event.id}`, { data: { title: 'Compromis' } })).status(),
    ).toBe(403);
    expect((await owner.delete(`/events/${event.id}`)).status()).toBe(409);
    expect((await (await owner.get(`/events/${event.id}`)).json()).title).toBe(event.title);
  });

  test('un état annulé reste terminal et ne ressuscite jamais', async () => {
    const event = await publishEvent('terminal');
    expect((await owner.patch(`/events/${event.id}/cancel`)).status()).toBe(200);

    expect((await owner.patch(`/events/${event.id}/cancel`)).status()).toBe(409);
    expect((await owner.patch(`/events/${event.id}/publish`)).status()).toBe(409);
    expect(
      (await owner.patch(`/events/${event.id}`, { data: { title: 'Résurrection' } })).status(),
    ).toBe(409);
    expect(
      (await owner.put(`/events/${event.id}/access-configuration`, {
        data: {
          discoverability: 'public',
          accessPolicy: { type: 'open' },
          admissionModes: ['registration_only'],
        },
      })).status(),
    ).toBe(409);
    expect((await (await owner.get(`/events/${event.id}`)).json()).status).toBe('cancelled');
  });

  for (const [width, height] of [
    [320, 720],
    [375, 812],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1538, 1100],
  ] as const) {
    test(`confirmation utilisable sans overflow à ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`/tableau-de-bord/evenements/${responsiveEvent.id}/parametres`);
      await page.getByRole('button', { name: /Annuler l['’]événement/ }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Conserver l’événement' })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Annuler l’événement' })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Conserver l’événement' })).toBeFocused();
      await expectNoHorizontalOverflow(page);

      if (width === 390 || width === 1440) {
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(
          result.violations.filter((item) =>
            ['critical', 'serious'].includes(item.impact ?? ''),
          ),
        ).toEqual([]);
      }

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(page.getByRole('button', { name: /Annuler l['’]événement/ })).toBeFocused();
    });
  }

  test('les cartes des paramètres ne réintroduisent aucun contour décoratif', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/tableau-de-bord/evenements/${responsiveEvent.id}/parametres`);
    await expect(page.getByRole('heading', { name: 'Zone de danger' })).toBeVisible();
    const borders = await page.locator('section.rounded-3xl').evaluateAll((sections) =>
      sections.map((section) => {
        const style = getComputedStyle(section);
        return [
          style.borderTopWidth,
          style.borderRightWidth,
          style.borderBottomWidth,
          style.borderLeftWidth,
        ];
      }),
    );
    expect(borders.length).toBeGreaterThan(0);
    expect(borders.every((sides) => sides.every((width) => width === '0px'))).toBe(true);
  });
});

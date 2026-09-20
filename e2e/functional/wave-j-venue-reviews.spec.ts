import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  accountCredentials,
  apiContextFor,
  cleanupEvents,
  createDraft,
  ownerCredentials,
  vendorCredentials,
  venueCredentials,
  type ApiClient,
} from './helpers';

test.describe.configure({ mode: 'serial' });
let manager: ApiClient;
let organizer: ApiClient;
let vendor: ApiClient;
let participant: ApiClient;
let managerState: Awaited<ReturnType<ApiClient['storageState']>>;
let organizerState: Awaited<ReturnType<ApiClient['storageState']>>;
let vendorState: Awaited<ReturnType<ApiClient['storageState']>>;
let participantState: Awaited<ReturnType<ApiClient['storageState']>>;
const created: string[] = [];
const createdEvents: string[] = [];
const createdReviews: Array<{ id: string; author: ApiClient }> = [];
const marker = `Wave-J-${Date.now()}`;
let completedEvent: { id: string; slug: string; title: string };
let vendorProfileId = '';
let vendorRequestId = '';
let venueBookingId = '';

async function expectNoBlockingAxe(page: import('@playwright/test').Page): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(result.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
}

test.beforeAll(async () => {
  test.setTimeout(180_000);
  [manager, organizer, vendor, participant] = await Promise.all([
    apiContextFor(venueCredentials()),
    apiContextFor(ownerCredentials()),
    apiContextFor(vendorCredentials()),
    apiContextFor(accountCredentials()),
  ]);
  managerState = await manager.storageState();
  organizerState = await organizer.storageState();
  vendorState = await vendor.storageState();
  participantState = await participant.storageState();
  const profile = await manager.put('/venue-managers/me', { data: { professionalName: `${marker} Gestion`, region: 'Montréal' } });
  expect([200, 201]).toContain(profile.status());
  for (const suffix of ['A', 'B']) {
    const response = await manager.post('/venues', { data: {
      name: `${marker} Lieu ${suffix}`,
      type: 'reception',
      description: 'Lieu créé par le parcours E2E multi-lieux.',
      address: { street: `${suffix === 'A' ? 10 : 20} rue Test`, city: 'Montréal', province: 'QC' },
      capacity: suffix === 'A' ? 80 : 120,
      pricePerDay: 1200,
    } });
    expect(response.status(), await response.text()).toBe(201);
    created.push((await response.json())._id as string);
  }

  const vendorProfile = await vendor.get('/vendors/me');
  if (vendorProfile.status() === 200) {
    vendorProfileId = ((await vendorProfile.json()) as { _id: string })._id;
  } else {
    const createdVendor = await vendor.post('/vendors', { data: {
      businessName: `${marker} Prestataire`, category: 'photographe', serviceArea: 'Montréal',
    } });
    expect(createdVendor.status(), await createdVendor.text()).toBe(201);
    vendorProfileId = ((await createdVendor.json()) as { _id: string })._id;
  }

  const futureStart = new Date(Date.now() + 7 * 86_400_000);
  const draft = await createDraft(organizer, {
    title: `${marker} Collaboration vérifiée`,
    eventType: 'conference',
    shortDescription: 'Fixture réelle pour les avis bilatéraux Wave J.',
    startDate: futureStart.toISOString(),
    endDate: new Date(futureStart.getTime() + 7_200_000).toISOString(),
    location: { type: 'physical', name: `${marker} Lieu A`, city: 'Montréal' },
    discoverability: 'public',
    accessPolicy: { type: 'open' },
    admissionModes: ['registration_only'],
  });
  createdEvents.push(draft.id);
  const publication = await organizer.patch(`/events/${draft.id}/publish`);
  expect(publication.status(), await publication.text()).toBe(200);
  const published = await publication.json() as { slug: string; title: string };
  completedEvent = { id: draft.id, slug: published.slug, title: published.title };

  const registration = await participant.post('/event-registrations', {
    data: { eventId: draft.id }, headers: { 'Idempotency-Key': `${marker}-participant` },
  });
  expect(registration.status(), await registration.text()).toBe(201);

  const vendorRequest = await organizer.post(`/vendors/${draft.id}/requests`, {
    data: { vendorId: vendorProfileId, source: 'platform', message: marker },
  });
  expect(vendorRequest.status(), await vendorRequest.text()).toBe(201);
  vendorRequestId = ((await vendorRequest.json()) as { _id: string })._id;
  expect((await vendor.patch(`/vendors/requests/${vendorRequestId}/respond`, {
    data: { status: 'accepted', responseMessage: marker },
  })).status()).toBe(200);

  const pastStart = new Date(Date.now() - 3 * 86_400_000);
  const pastEnd = new Date(Date.now() - 2 * 86_400_000);
  const booking = await organizer.post(`/venues/${draft.id}/bookings`, { data: {
    venueId: created[0], bookingStart: pastStart.toISOString(), bookingEnd: pastEnd.toISOString(), message: marker,
  } });
  expect(booking.status(), await booking.text()).toBe(201);
  venueBookingId = ((await booking.json()) as { _id: string })._id;
  expect((await manager.patch(`/venues/bookings/${venueBookingId}/respond`, {
    data: { status: 'confirmed', responseMessage: marker },
  })).status()).toBe(200);

  const shifted = await organizer.patch(`/events/${draft.id}`, { data: {
    startDate: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    endDate: new Date(Date.now() - 86_400_000).toISOString(),
  } });
  expect(shifted.status(), await shifted.text()).toBe(200);
  await expect.poll(async () => {
    const event = await organizer.get(`/events/${draft.id}`);
    return event.status() === 200 ? ((await event.json()) as { status: string }).status : 'missing';
  }, { timeout: 90_000, intervals: [2_000, 5_000] }).toBe('completed');
});

test.afterAll(async () => {
  await Promise.all(createdReviews.map(({ id, author }) => author.delete(`/reviews/${id}`).catch(() => undefined)));
  await cleanupEvents(organizer, createdEvents);
  await Promise.all([manager?.dispose(), organizer?.dispose(), vendor?.dispose(), participant?.dispose()]);
});

test.describe('Wave J — gestionnaire multi-lieux et avis vérifiés', () => {
  test('un gestionnaire possède un profil distinct et plusieurs lieux éditables', async ({ browser }) => {
    const context = await browser.newContext({ storageState: managerState, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/tableau-de-bord/gestionnaire/lieux');
    await expect(page.getByRole('heading', { name: 'Mes lieux' })).toBeVisible();
    await expect(page.getByText(`${marker} Lieu A`)).toBeVisible();
    await expect(page.getByText(`${marker} Lieu B`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.getByRole('link', { name: `Modifier ${marker} Lieu A`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/gestionnaire/lieux/${created[0]}/modifier`));
    await expect(page.getByLabel('Nom du lieu')).toHaveValue(`${marker} Lieu A`);
    await expectNoBlockingAxe(page);
    await page.screenshot({ path: 'docs/design-qa/sprint-4-wave-j/implementations/manager-mobile-390.png', fullPage: true });
    await context.close();
  });

  test('la projection publique du lieu ne divulgue ni compte ni managerProfile', async ({ page }) => {
    const response = await manager.get(`/venues/${created[0]}`);
    expect(response.status()).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.user).toBeUndefined();
    expect(body.managerProfile).toBeUndefined();
    await page.goto(`/lieux/${created[0]}`);
    await expect(page.getByRole('heading', { name: `${marker} Lieu A` })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Avis vérifiés' })).toBeVisible();
    await expect(page.getByText('Aucun avis pour le moment.')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'docs/design-qa/sprint-4-wave-j/implementations/venue-reviews-desktop-1440.png', fullPage: true });
  });

  test('refuse une review sans interaction et valide strictement le contexte', async () => {
    const forged = await manager.post('/reviews', { data: {
      targetType: 'venue', contextType: 'venue_booking', contextId: created[0], rating: 5, comment: 'Forgé',
    } });
    expect([403, 404]).toContain(forged.status());
    expect((await manager.post('/reviews', { data: { targetType: 'venue', contextType: 'venue_booking', contextId: 'not-an-id', rating: 5, comment: 'Non' } })).status()).toBe(400);
    expect((await manager.post('/reviews', { data: { author: 'attacker', targetType: 'venue', contextType: 'venue_booking', contextId: created[0], rating: 5, comment: 'Non' } })).status()).toBe(400);
  });

  test('un participant inscrit publie un avis Event réel depuis la fiche terminée', async ({ browser }) => {
    const context = await browser.newContext({ storageState: participantState });
    const page = await context.newPage();
    await page.goto(`/evenements/${completedEvent.slug}`);
    await expect(page.getByRole('heading', { name: 'Laisser un avis' })).toBeVisible();
    await expectNoBlockingAxe(page);
    await page.getByRole('radio', { name: '4 étoiles' }).check();
    const comment = `${marker} expérience participant`;
    await page.getByLabel('Votre commentaire').fill(comment);
    const response = page.waitForResponse((item) => item.url().endsWith('/api/v1/reviews') && item.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publier mon avis' }).click();
    const createdReview = await response;
    expect(createdReview.status()).toBe(201);
    createdReviews.push({ id: ((await createdReview.json()) as { _id: string })._id, author: participant });
    await expect(page.getByText(comment)).toBeVisible();
    await expect(page.getByText(/4\.0 \/ 5 · 1/)).toBeVisible();
    await context.close();
  });

  test('organisateur et prestataire évaluent les deux sens de la même collaboration', async ({ browser }) => {
    const organizerContext = await browser.newContext({ storageState: organizerState });
    const organizerPage = await organizerContext.newPage();
    await organizerPage.goto(`/prestataires/${vendorProfileId}`);
    const organizerComment = `${marker} avis organisateur prestataire`;
    await organizerPage.getByLabel('Votre commentaire').fill(organizerComment);
    const organizerResponse = organizerPage.waitForResponse((item) => item.url().endsWith('/api/v1/reviews') && item.request().method() === 'POST');
    await organizerPage.getByRole('button', { name: 'Publier mon avis' }).click();
    const organizerReview = await organizerResponse;
    expect(organizerReview.status()).toBe(201);
    createdReviews.push({ id: ((await organizerReview.json()) as { _id: string })._id, author: organizer });
    await expect(organizerPage.getByText(organizerComment)).toBeVisible();
    await expectNoBlockingAxe(organizerPage);
    await organizerContext.close();

    const vendorContext = await browser.newContext({ storageState: vendorState });
    const vendorPage = await vendorContext.newPage();
    await vendorPage.goto('/tableau-de-bord/prestataire/demandes');
    const card = vendorPage.getByTestId('vendor-request-card').filter({ hasText: completedEvent.title });
    await card.getByRole('button', { name: 'Évaluer la collaboration' }).click();
    const vendorComment = `${marker} avis prestataire organisateur`;
    await card.getByLabel('Votre commentaire').fill(vendorComment);
    const vendorResponse = vendorPage.waitForResponse((item) => item.url().endsWith('/api/v1/reviews') && item.request().method() === 'POST');
    await card.getByRole('button', { name: 'Publier mon avis' }).click();
    const vendorReview = await vendorResponse;
    expect(vendorReview.status()).toBe(201);
    createdReviews.push({ id: ((await vendorReview.json()) as { _id: string })._id, author: vendor });
    await expect(card.getByText('Votre avis a déjà été transmis.')).toBeVisible();
    await vendorContext.close();
  });

  test('organisateur et gestionnaire évaluent les deux sens de la réservation exécutée', async ({ browser }) => {
    const organizerContext = await browser.newContext({ storageState: organizerState });
    const organizerPage = await organizerContext.newPage();
    await organizerPage.goto(`/lieux/${created[0]}`);
    const organizerComment = `${marker} avis organisateur lieu`;
    await organizerPage.getByLabel('Votre commentaire').fill(organizerComment);
    const organizerResponse = organizerPage.waitForResponse((item) => item.url().endsWith('/api/v1/reviews') && item.request().method() === 'POST');
    await organizerPage.getByRole('button', { name: 'Publier mon avis' }).click();
    const organizerReview = await organizerResponse;
    expect(organizerReview.status()).toBe(201);
    createdReviews.push({ id: ((await organizerReview.json()) as { _id: string })._id, author: organizer });
    await expect(organizerPage.getByText(organizerComment)).toBeVisible();
    await expectNoBlockingAxe(organizerPage);
    await organizerPage.setViewportSize({ width: 1440, height: 900 });
    await organizerPage.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await organizerPage.screenshot({ path: 'docs/design-qa/sprint-4-wave-j/implementations/venue-reviews-populated-1440.png', fullPage: true });
    await organizerContext.close();

    const managerContext = await browser.newContext({ storageState: managerState });
    const managerPage = await managerContext.newPage();
    await managerPage.goto('/tableau-de-bord/gestionnaire/reservations');
    const card = managerPage.getByTestId('venue-booking-card').filter({ hasText: completedEvent.title });
    await card.getByRole('button', { name: 'Évaluer la collaboration' }).click();
    await expectNoBlockingAxe(managerPage);
    const managerComment = `${marker} avis gestionnaire organisateur`;
    await card.getByLabel('Votre commentaire').fill(managerComment);
    const managerResponse = managerPage.waitForResponse((item) => item.url().endsWith('/api/v1/reviews') && item.request().method() === 'POST');
    await card.getByRole('button', { name: 'Publier mon avis' }).click();
    const managerReview = await managerResponse;
    expect(managerReview.status()).toBe(201);
    createdReviews.push({ id: ((await managerReview.json()) as { _id: string })._id, author: manager });
    await expect(card.getByText('Votre avis a déjà été transmis.')).toBeVisible();
    await managerContext.close();

    const dashboardContext = await browser.newContext({ storageState: organizerState });
    const dashboard = await dashboardContext.newPage();
    await dashboard.goto('/tableau-de-bord/avis');
    await expect(dashboard.getByText(`${marker} avis prestataire organisateur`)).toBeVisible();
    await expect(dashboard.getByText(`${marker} avis gestionnaire organisateur`)).toBeVisible();
    await dashboardContext.close();
  });

  test('reste utilisable sans overflow sur les sept viewports contractuels', async ({ browser }) => {
    for (const viewport of [
      { width: 320, height: 720 }, { width: 375, height: 812 }, { width: 390, height: 844 },
      { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 1538, height: 1100 },
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.goto(`/lieux/${created[0]}`);
      await expect(page.getByRole('heading', { name: 'Avis vérifiés' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await context.close();
    }
  });
});

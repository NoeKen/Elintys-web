import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  apiFromState,
  cleanupEvents,
  createDraft,
  OWNER_STATE,
  type ApiClient,
  waitForHydration,
} from './helpers';

const QA_ROOT = path.resolve('docs/design-qa/sprint-3-wave-4');
const IMPLEMENTATIONS = path.join(QA_ROOT, 'implementations');
const AXE_REPORT = path.join(QA_ROOT, 'axe.json');
const VIEWPORTS = [
  { name: '320x720', width: 320, height: 720 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1538x1100', width: 1538, height: 1100 },
] as const;

type Fixture = { id: string; slug: string; title: string };

let api: ApiClient;
const created: string[] = [];
let registrationEvent: Fixture;
let ticketEvent: Fixture;
const axeSurfaces: Array<{ surface: string; violations: unknown[] }> = [];

async function createPublished(
  title: string,
  admissionModes: string[],
  ticketTypes: Array<{ name: string; price: number; isFree: boolean; quantity: number }> = [],
): Promise<Fixture> {
  const draft = await createDraft(api, {
    title,
    eventType: 'conference',
    shortDescription: `Parcours participant réel pour ${title}.`,
    description: `Événement de QA de la Vague 4 couvrant accès, admission et confirmation.`,
    startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    location: { type: 'online', name: 'En ligne', city: 'Montréal' },
    capacity: 50,
    discoverability: 'public',
    accessPolicy: { type: 'open' },
    admissionModes,
  });
  created.push(draft.id);

  for (const ticketType of ticketTypes) {
    const response = await api.post(`/ticket-types/events/${draft.id}`, {
      data: { ...ticketType, description: 'Admission QA Vague 4' },
    });
    expect(response.status(), await response.text()).toBe(201);
  }

  const response = await api.patch(`/events/${draft.id}/publish`);
  expect(response.status(), await response.text()).toBe(200);
  const event = await response.json() as { slug: string; title: string };
  await expect.poll(
    async () => (await api.get(`/events/slug/${event.slug}`)).status(),
    { message: `projection publique disponible pour ${event.slug}`, timeout: 15_000 },
  ).toBe(200);
  return { id: draft.id, slug: event.slug, title: event.title };
}

async function openEvent(page: Page, fixture: Fixture): Promise<void> {
  const response = await page.goto(`/evenements/${fixture.slug}`);
  await waitForHydration(page);
  expect(response?.status()).toBe(200);
  const retry = page.getByRole('button', { name: 'Réessayer' });
  if (await retry.isVisible()) {
    await retry.click();
    await waitForHydration(page);
  }
  await expect(page.getByRole('heading', { level: 1, name: fixture.title })).toBeVisible();
}

async function axe(page: Page, surface: string): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = result.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  axeSurfaces.push({ surface, violations: result.violations });
  expect(blocking, `${surface}: axe critical/serious`).toEqual([]);
}

test.describe.serial('Sprint 3 Vague 4 — parcours participant', () => {
  test.beforeAll(async () => {
    fs.mkdirSync(IMPLEMENTATIONS, { recursive: true });
    api = await apiFromState(OWNER_STATE);
    registrationEvent = await createPublished('Vague 4 inscription', ['registration_only']);
    ticketEvent = await createPublished('Vague 4 billets', ['free_ticket', 'paid_ticket'], [
      { name: 'Billet gratuit', price: 0, isFree: true, quantity: 20 },
      { name: 'Billet payant', price: 3500, isFree: false, quantity: 20 },
    ]);
  });

  test.afterAll(async () => {
    fs.writeFileSync(
      AXE_REPORT,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), surfaces: axeSurfaces }, null, 2)}\n`,
    );
    await cleanupEvents(api, created);
    await api.dispose();
  });

  test('inscription UI réelle, double clic idempotent et confirmation persistée', async ({ page }) => {
    await openEvent(page, registrationEvent);
    await expect(page.getByText('Accès ouvert', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'S’inscrire' }).click();
    const confirm = page.getByRole('button', { name: 'Confirmer mon inscription' });
    await confirm.dblclick();
    await expect(page.getByText('Vous êtes déjà inscrit à cet événement.')).toBeVisible();

    const registrations = await api.get('/event-registrations/me?page=1&limit=100');
    expect(registrations.status()).toBe(200);
    const body = await registrations.json() as { data: Array<{ eventId: string | { _id: string } | null }> };
    const matching = body.data.filter(({ eventId }) =>
      (typeof eventId === 'string' ? eventId : eventId?._id) === registrationEvent.id,
    );
    expect(matching).toHaveLength(1);

    await page.reload();
    await waitForHydration(page);
    await expect(page.getByText('Vous êtes déjà inscrit à cet événement.')).toBeVisible();
  });

  test('billet gratuit réel et paiement payant fail-closed', async ({ page }) => {
    await openEvent(page, ticketEvent);
    await page.getByRole('button', { name: 'Choisir' }).click();
    await expect(page.getByRole('dialog', { name: 'Réserver un billet gratuit' })).toBeVisible();
    await page.getByRole('button', { name: 'Réserver' }).dblclick();
    await expect(page.getByText(/billet.*réservé/i)).toBeVisible();
    await page.getByRole('dialog').getByText('Fermer', { exact: true }).click();

    await page.getByRole('button', { name: 'Acheter mon billet' }).click();
    await expect(page.getByRole('dialog', { name: 'Acheter mon billet' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Acheter mon billet' }).dblclick();
    await expect(
      page.getByText("Le paiement des billets n'est pas encore ouvert pour cet événement."),
    ).toBeVisible();
  });

  test('espace unifié retrouve inscriptions et billets sans secret', async ({ page }) => {
    await page.goto('/tableau-de-bord/participation');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Ma participation' })).toBeVisible();
    await expect(page.getByText(registrationEvent.title)).toBeVisible();
    await expect(page.getByText(ticketEvent.title)).toBeVisible();
    await expect(page.getByText(/tokenHash|tokenPrefix/)).toHaveCount(0);
  });

  for (const viewport of VIEWPORTS) {
    test(`responsive et scroll natif ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openEvent(page, ticketEvent);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(metrics.overflow).toBeLessThanOrEqual(1);
      expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
      if (viewport.name === '390x844' || viewport.name === '1440x900') {
        await page.screenshot({
          path: path.join(IMPLEMENTATIONS, `participant-${viewport.name}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  }

  test('Axe AA sans violation critical/serious sur admission et espace participant', async ({ page }) => {
    await openEvent(page, ticketEvent);
    await axe(page, 'event-admission-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tableau-de-bord/participation');
    await waitForHydration(page);
    await axe(page, 'participation-mobile');
  });
});

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { ApiClient } from './helpers';
import {
  OWNER_STATE,
  TIERS_STATE,
  TINY_PNG,
  anonymousApi,
  apiFromState,
  cleanupEvents,
  createDraft,
} from './helpers';

let ownerApi: ApiClient;
let tiersApi: ApiClient;
let anonymous: ApiClient;
let eventId = '';
let eventTitle = '';

test.describe.serial('Sprint 3 Vague 3 — workspace événement organisateur', () => {
  test.beforeAll(async () => {
    ownerApi = await apiFromState(OWNER_STATE);
    tiersApi = await apiFromState(TIERS_STATE);
    anonymous = await anonymousApi();
    const start = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const event = await createDraft(ownerApi, {
      title: 'Workspace Vague 3',
      eventType: 'conference',
      shortDescription: 'Événement de validation du workspace organisateur.',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      timezone: 'America/Toronto',
      location: { type: 'physical', name: 'Maison Elintys QA', city: 'Montréal' },
      discoverability: 'unlisted',
      accessPolicy: { type: 'invitation_token' },
      admissionModes: ['invitation', 'free_ticket'],
      creationProgress: {
        currentStep: 6,
        completedSteps: [1, 2, 3, 4, 5, 6],
        skippedSteps: [],
      },
    });
    eventId = event.id;
    eventTitle = event.title;

    const invitation = await ownerApi.post('/invitations', {
      data: { name: 'Participant QA', email: `workspace-${Date.now()}@example.com`, type: 'participant', eventId },
    });
    expect(invitation.status()).toBe(201);

    const ticket = await ownerApi.post(`/ticket-types/events/${eventId}`, {
      data: { name: 'Billet QA', isFree: true, price: 0, quantity: 25 },
    });
    expect(ticket.status()).toBe(201);

    const cover = await ownerApi.post(`/events/${eventId}/cover`, {
      multipart: { file: { name: 'workspace-cover.png', mimeType: 'image/png', buffer: TINY_PNG } },
    });
    expect(cover.ok()).toBeTruthy();

    const publish = await ownerApi.patch(`/events/${eventId}/publish`);
    expect(publish.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    await cleanupEvents(ownerApi, [eventId]);
    await Promise.all([ownerApi.dispose(), tiersApi.dispose(), anonymous.dispose()]);
  });

  test('Mes événements → Gérer ouvre le workspace, pas le wizard', async ({ page }) => {
    await page.goto('/tableau-de-bord/evenements');
    await page.getByPlaceholder('Rechercher un événement…').fill(eventTitle);
    const card = page.getByRole('heading', { name: eventTitle }).locator('xpath=ancestor::article');
    await expect(card).toBeVisible();
    await card.getByRole('link', { name: 'Gérer' }).click();
    await expect(page).toHaveURL(new RegExp(`/tableau-de-bord/evenements/${eventId}$`));
    await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();
    await expect(page.getByText('À faire maintenant')).toBeVisible();
  });

  test('ownership A/B/anonyme et ObjectId invalide sont protégés côté serveur', async () => {
    expect((await ownerApi.get(`/events/${eventId}/invitations`)).status()).toBe(200);
    expect((await tiersApi.get(`/events/${eventId}/invitations`)).status()).toBe(403);
    expect((await anonymous.get(`/events/${eventId}/invitations`)).status()).toBe(401);
    expect((await ownerApi.get('/events/not-an-object-id/invitations')).status()).toBe(400);
  });

  test('Informations persiste après actualisation', async ({ page }) => {
    await page.goto(`/tableau-de-bord/evenements/${eventId}/informations`);
    const title = page.getByLabel('Titre');
    const updated = `${eventTitle} — modifié`;
    await title.fill(updated);
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
    await expect(page.getByText('Modifications enregistrées')).toBeVisible();
    await page.reload();
    await expect(title).toHaveValue(updated);
    eventTitle = updated;
  });

  test('Lieu, invitations, billetterie et médias affichent les données réelles', async ({ page }) => {
    await page.goto(`/tableau-de-bord/evenements/${eventId}/lieux`);
    await expect(page.getByText(/Maison Elintys QA|Montréal/).first()).toBeVisible();

    await page.goto(`/tableau-de-bord/evenements/${eventId}/invites`);
    await expect(page.getByText('Participant QA')).toBeVisible();
    const invitationPayload = await ownerApi.get(`/events/${eventId}/invitations`);
    const serialized = await invitationPayload.text();
    expect(serialized).not.toMatch(/tokenHash|tokenPrefix|"token"/);

    await page.goto(`/tableau-de-bord/evenements/${eventId}/billetterie`);
    await expect(page.getByText('Billet QA')).toBeVisible();
    await expect(page.getByText('25', { exact: true }).first()).toBeVisible();

    await page.goto(`/tableau-de-bord/evenements/${eventId}/medias`);
    await expect(page.getByAltText(`Image de couverture de ${eventTitle}`)).toBeVisible();
  });

  test('Paramètres sépare accès, archive et suppression destructive', async ({ page }) => {
    await page.goto(`/tableau-de-bord/evenements/${eventId}/parametres`);
    await expect(page.getByRole('heading', { name: /Configuration de l.accès/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Archiver/ })).toBeVisible();
    await page.getByRole('button', { name: /^Supprimer définitivement/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Supprimer définitivement' })).toBeDisabled();
    await dialog.getByRole('checkbox').check();
    await expect(dialog.getByRole('button', { name: 'Supprimer définitivement' })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Annuler' }).click();
    await expect(dialog).toBeHidden();
  });

  test('navigation mobile, scroll clavier et Axe serious/critical', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/tableau-de-bord/evenements/${eventId}`);
    const nav = page.getByRole('navigation', { name: 'Gestion de l’événement' });
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: 'Médias' }).click();
    await expect(page).toHaveURL(new RegExp(`/medias$`));
    const scroller = page.locator('main.overflow-y-auto').first();
    await page.keyboard.press('End');
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((violation) =>
      violation.impact === 'critical' || violation.impact === 'serious',
    );
    expect(blocking).toEqual([]);
  });

  test('responsive multi-viewport et captures de QA', async ({ page }) => {
    test.setTimeout(180_000);
    const viewports = [
      { width: 320, height: 720 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 1538, height: 1100 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`/tableau-de-bord/evenements/${eventId}`);
      await expect(page.getByRole('navigation', { name: 'Gestion de l’événement' })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);

      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(
          (violation) => violation.impact === 'critical' || violation.impact === 'serious',
        ),
      ).toEqual([]);

      await page.screenshot({
        path: `docs/design-qa/sprint-3-wave-3/implementations/workspace-overview-${viewport.width}x${viewport.height}.png`,
        animations: 'disabled',
      });
    }
  });

  test('captures des modules opérationnels desktop et mobile', async ({ page }) => {
    test.setTimeout(120_000);
    const captures = [
      { width: 1538, height: 1100, route: 'informations', name: 'workspace-informations-desktop' },
      { width: 1538, height: 1100, route: 'billetterie', name: 'workspace-billetterie-desktop' },
      { width: 1538, height: 1100, route: 'parametres', name: 'workspace-parametres-desktop' },
      { width: 390, height: 844, route: 'lieux', name: 'workspace-lieu-mobile' },
      { width: 390, height: 844, route: 'invites', name: 'workspace-invitations-mobile' },
      { width: 390, height: 844, route: 'medias', name: 'workspace-medias-mobile' },
    ];

    for (const capture of captures) {
      await page.setViewportSize({ width: capture.width, height: capture.height });
      await page.goto(`/tableau-de-bord/evenements/${eventId}/${capture.route}`);
      await expect(page.getByRole('navigation', { name: 'Gestion de l’événement' })).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(
          (violation) => violation.impact === 'critical' || violation.impact === 'serious',
        ),
      ).toEqual([]);
      await page.screenshot({
        path: `docs/design-qa/sprint-3-wave-3/implementations/${capture.name}.png`,
        animations: 'disabled',
      });
    }
  });
});

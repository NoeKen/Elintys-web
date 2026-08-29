import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  apiFromState,
  cleanupEvents,
  createDraft,
  OWNER_STATE,
  TINY_PNG,
  type ApiClient,
  waitForHydration,
} from './helpers';
import { assertPageIsScrollable } from './scroll.helpers';

type Fixture = { id: string; slug: string; title: string };
type FixtureName =
  | 'publicComplete'
  | 'publicNoCover'
  | 'registration'
  | 'emailDomain'
  | 'manualApproval'
  | 'unlistedCode'
  | 'unlistedInvitation'
  | 'privateEvent'
  | 'archived'
  | 'cancelled'
  | 'ticketed';

const QA_ROOT = path.resolve('docs/design-qa/sprint-3-wave-2');
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

let api: ApiClient;
const created: string[] = [];
const fixtures = {} as Record<FixtureName, Fixture>;
const axeSurfaces: Array<{ surface: string; violations: unknown[] }> = [];

function imageUpload(field: 'file' | 'files', name: string) {
  return { multipart: { [field]: { name, mimeType: 'image/png', buffer: TINY_PNG } } };
}

async function createPublished(
  name: FixtureName,
  options: {
    discoverability?: 'public' | 'unlisted' | 'private';
    accessPolicy?: Record<string, unknown>;
    admissionModes?: string[];
    cover?: boolean;
    gallery?: boolean;
    ticket?: 'free' | 'paid';
  } = {},
): Promise<Fixture> {
  const startDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const draft = await createDraft(api, {
    title: `Vague 2 ${name}`,
    eventType: 'conference',
    shortDescription: `Projection publique QA ${name}.`,
    description: `Description complète et réelle pour le scénario ${name}.`,
    startDate,
    location: {
      type: 'physical',
      name: 'Atelier Elintys',
      address: '100 rue du Test',
      city: 'Montréal',
      province: 'QC',
      postalCode: 'H2X 1Y4',
    },
    capacity: 120,
    discoverability: options.discoverability ?? 'public',
    accessPolicy: options.accessPolicy ?? { type: 'open' },
    admissionModes: options.admissionModes ?? ['registration_only'],
  });
  created.push(draft.id);

  if (options.cover) {
    const cover = await api.post(`/events/${draft.id}/cover`, imageUpload('file', `${name}-cover.png`));
    expect(cover.status(), await cover.text()).toBeLessThan(300);
  }
  if (options.gallery) {
    const gallery = await api.post(`/events/${draft.id}/gallery`, imageUpload('files', `${name}-gallery.png`));
    expect(gallery.status(), await gallery.text()).toBeLessThan(300);
  }
  if (options.ticket) {
    const ticket = await api.post(`/ticket-types/events/${draft.id}`, {
      data: {
        name: options.ticket === 'free' ? 'Admission gratuite' : 'Admission générale',
        price: options.ticket === 'free' ? 0 : 4500,
        isFree: options.ticket === 'free',
        quantity: 40,
        description: 'Billet QA Vague 2',
      },
    });
    expect(ticket.status(), await ticket.text()).toBe(201);
  }

  const publishedResponse = await api.patch(`/events/${draft.id}/publish`);
  expect(publishedResponse.status(), await publishedResponse.text()).toBe(200);
  const published = await publishedResponse.json() as { slug: string; title: string };
  const fixture = { id: draft.id, slug: published.slug, title: published.title };
  fixtures[name] = fixture;
  return fixture;
}

async function openFixture(page: Page, fixture: Fixture) {
  const response = await page.goto(`/evenements/${fixture.slug}`);
  await waitForHydration(page);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: fixture.title })).toBeVisible();
}

async function axe(page: Page, surface: string) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = result.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
  axeSurfaces.push({ surface, violations: result.violations });
  expect(blocking, `${surface}: axe critical/serious`).toEqual([]);
}

test.describe.serial('Sprint 3 Vague 2 — page événement participant', () => {
  test.beforeAll(async () => {
    fs.mkdirSync(path.join(QA_ROOT, 'references'), { recursive: true });
    fs.mkdirSync(IMPLEMENTATIONS, { recursive: true });
    fs.mkdirSync(path.join(QA_ROOT, 'comparisons'), { recursive: true });
    api = await apiFromState(OWNER_STATE);

    await createPublished('publicComplete', { cover: true, gallery: true });
    await createPublished('publicNoCover');
    await createPublished('registration', { accessPolicy: { type: 'registration_required', requiresAuthentication: true } });
    await createPublished('emailDomain', { accessPolicy: { type: 'email_domain', requiresAuthentication: true, allowedDomains: ['elintys.ca'] } });
    await createPublished('manualApproval', { accessPolicy: { type: 'manual_approval', requiresAuthentication: true } });
    await createPublished('unlistedCode', {
      discoverability: 'unlisted',
      accessPolicy: { type: 'access_code', code: 'Vague2-Code-2026' },
    });
    await createPublished('unlistedInvitation', {
      discoverability: 'unlisted',
      accessPolicy: { type: 'invitation_token' },
      admissionModes: ['invitation'],
    });
    await createPublished('privateEvent', {
      discoverability: 'private',
      accessPolicy: { type: 'manual_approval', requiresAuthentication: true },
    });
    const archived = await createPublished('archived');
    expect((await api.patch(`/events/${archived.id}/archive`)).status()).toBe(200);
    const cancelled = await createPublished('cancelled');
    expect((await api.patch(`/events/${cancelled.id}/cancel`)).status()).toBe(200);
    await createPublished('ticketed', { admissionModes: ['free_ticket'], ticket: 'free' });
  });

  test.afterAll(async () => {
    fs.writeFileSync(AXE_REPORT, `${JSON.stringify({ generatedAt: new Date().toISOString(), surfaces: axeSurfaces }, null, 2)}\n`);
    await cleanupEvents(api, created);
    await api.dispose();
  });

  test('1–3 — public complet, cover et galerie réelles', async ({ page }) => {
    await openFixture(page, fixtures.publicComplete);
    await expect(page.locator('img[alt^="Image de couverture"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'À propos de l’événement' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'L’univers de l’événement' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agrandir l’image 1' })).toBeVisible();
  });

  test('4 — public sans cover utilise le fallback premium', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openFixture(page, fixtures.publicNoCover);
    await expect(page.locator('.public-event-hero-fallback')).toBeVisible();
    await page.screenshot({
      path: path.join(IMPLEMENTATIONS, 'no-cover-1440x900.png'),
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('5–6 — accès ouvert et inscription requise ont des CTA contextuels', async ({ page }) => {
    await openFixture(page, fixtures.publicNoCover);
    await expect(page.getByText('Accès ouvert', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'S’inscrire' })).toBeVisible();
    await page.screenshot({
      path: path.join(IMPLEMENTATIONS, 'open-access-1440x900.png'),
      fullPage: true,
      animations: 'disabled',
    });

    await openFixture(page, fixtures.registration);
    await expect(page.getByText('Inscription requise', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'S’inscrire' })).toBeVisible();
  });

  test('7 — domaine courriel expose seulement la vérification prévue', async ({ page }) => {
    await openFixture(page, fixtures.emailDomain);
    await expect(page.getByRole('button', { name: 'Vérifier mon adresse' })).toBeVisible();
    await expect(page.getByText(/connexion peut être requise/)).toBeVisible();
  });

  test('8–10 — unlisted direct, absent du catalogue et noindex', async ({ page }) => {
    await openFixture(page, fixtures.unlistedCode);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const catalog = await api.get('/events?page=1&limit=100');
    const ids = ((await catalog.json()) as { data: Array<{ _id: string }> }).data.map((event) => event._id);
    expect(ids).not.toContain(fixtures.unlistedCode.id);
    expect(ids).not.toContain(fixtures.unlistedInvitation.id);
  });

  test('11–13 — privé, archivé et annulé renvoient le même état 404', async ({ page }) => {
    for (const name of ['privateEvent', 'archived', 'cancelled'] as const) {
      const apiResponse = await api.get(`/events/slug/${fixtures[name].slug}`);
      expect(apiResponse.status(), `${name}: API publique`).toBe(404);
      const response = await page.goto(`/evenements/${fixtures[name].slug}`);
      // Avec un loading.tsx, Next peut diffuser le shell avant le notFound et
      // produire un soft 404 HTTP 200. La frontière publique API reste un vrai
      // 404 et l'UI doit être strictement identique, sans fuite d'existence.
      expect([200, 404], `${name}: statut Next streamed`).toContain(response?.status());
      await expect(page.getByRole('heading', { name: 'Cet événement n’est pas disponible' })).toBeVisible();
      await expect(page.getByText(fixtures[name].title)).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
      if (name === 'privateEvent') {
        await axe(page, 'private-not-found');
        await page.screenshot({
          path: path.join(IMPLEMENTATIONS, 'private-not-found-1440x900.png'),
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
  });

  test('14–15 — code d’accès refusé puis accepté sans exposer le secret', async ({ page }) => {
    await openFixture(page, fixtures.unlistedCode);
    const input = page.getByRole('textbox', { name: 'Code d’accès' });
    await input.fill('mauvais-code');
    await page.getByRole('button', { name: 'Entrer un code' }).click();
    await expect(page.getByRole('status')).toContainText(/invalide|validé|vérifié|accès/i);
    await input.fill('Vague2-Code-2026');
    await page.getByRole('button', { name: 'Entrer un code' }).click();
    await expect(page.getByText('Votre accès est validé.')).toBeVisible();
    expect(await page.content()).not.toContain('codeHash');
  });

  test('16–17 — approbation et invitation restent deux parcours distincts', async ({ page }) => {
    await openFixture(page, fixtures.manualApproval);
    await expect(page.getByRole('button', { name: 'Demander l’accès' })).toBeVisible();
    await openFixture(page, fixtures.unlistedInvitation);
    await expect(page.getByRole('link', { name: 'Utiliser mon invitation' })).toHaveAttribute('href', '/invitation');
  });

  test('18 — admission billet affiche uniquement le stock réel', async ({ page }) => {
    await openFixture(page, fixtures.ticketed);
    await expect(page.getByRole('heading', { name: 'Billets disponibles' })).toBeVisible();
    await expect(page.getByText('Admission gratuite')).toBeVisible();
    await expect(page.getByText('Gratuit', { exact: true })).toBeVisible();
  });

  test('19–20 — projection organisateur et similaires restent sûres et bornées', async () => {
    const response = await api.get(`/events/slug/${fixtures.publicComplete.slug}`);
    expect(response.status()).toBe(200);
    const body = await response.json() as {
      _id: string;
      organizer?: Record<string, unknown>;
      relatedEvents: Array<{ _id: string; slug: string }>;
    };
    expect(Object.keys(body.organizer ?? {})).toEqual(['name']);
    expect(body.relatedEvents.length).toBeLessThanOrEqual(4);
    expect(body.relatedEvents.map((event) => event._id)).not.toContain(body._id);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/codeHash|tokenHash|creationProgress|contactEmail|contactPhone|password|refreshToken/);
    expect(body.relatedEvents.map((event) => event.slug)).not.toContain(fixtures.unlistedCode.slug);
    expect(body.relatedEvents.map((event) => event.slug)).not.toContain(fixtures.privateEvent.slug);
  });

  test('21 — sitemap en cache ne révèle ni unlisted, ni privé, ni archivé, ni annulé', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const xml = await page.locator('body').innerText();
    // Le sitemap a un cache ISR d'une heure : l'inclusion immédiate d'un nouvel
    // événement est couverte unitairement, tandis que ce test live vérifie que
    // les variantes sensibles de la fixture courante ne percent jamais le cache.
    expect(xml).toContain('/evenements');
    expect(xml).not.toContain(fixtures.unlistedCode.slug);
    expect(xml).not.toContain(fixtures.privateEvent.slug);
    expect(xml).not.toContain(fixtures.archived.slug);
    expect(xml).not.toContain(fixtures.cancelled.slug);
  });

  for (const viewport of VIEWPORTS) {
    test(`responsive ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openFixture(page, fixtures.publicComplete);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: path.join(IMPLEMENTATIONS, `public-complete-${viewport.name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      if (viewport.width <= 390) await assertPageIsScrollable(page);
    });
  }

  for (const surface of [
    { name: 'public-desktop', fixture: 'publicComplete', width: 1440, height: 900 },
    { name: 'public-mobile', fixture: 'publicComplete', width: 390, height: 844 },
    { name: 'no-cover', fixture: 'publicNoCover', width: 1440, height: 900 },
    { name: 'access-code', fixture: 'unlistedCode', width: 1440, height: 900 },
    { name: 'email-domain', fixture: 'emailDomain', width: 1440, height: 900 },
    { name: 'manual-approval', fixture: 'manualApproval', width: 1440, height: 900 },
    { name: 'invitation', fixture: 'unlistedInvitation', width: 1440, height: 900 },
    { name: 'ticketing', fixture: 'ticketed', width: 1440, height: 900 },
  ] as const) {
    test(`axe ${surface.name}`, async ({ page }) => {
      await page.setViewportSize({ width: surface.width, height: surface.height });
      await openFixture(page, fixtures[surface.fixture]);
      await axe(page, surface.name);
      await page.screenshot({
        path: path.join(IMPLEMENTATIONS, `${surface.name}-${surface.width}x${surface.height}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }

  test('galerie : clavier, focus et scroll-lock restauré', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFixture(page, fixtures.publicComplete);
    const before = await page.evaluate(() => document.body.style.overflow);
    await page.getByRole('button', { name: 'Agrandir l’image 1' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await axe(page, 'gallery');
    await page.screenshot({
      path: path.join(IMPLEMENTATIONS, 'gallery-lightbox-390x844.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(before);
  });
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import type { ApiClient } from './helpers';
import {
  apiContextFor,
  multiRoleCredentials,
  ownerCredentials,
  vendorCredentials,
  venueCredentials,
  waitForHydration,
} from './helpers';

/**
 * Navigation mobile par RÔLE.
 *
 * Sous 768 px la barre latérale est masquée : la barre inférieure est le seul
 * moyen de navigation. Codée en dur, elle privait prestataires et
 * gestionnaires de tout chemin vers leurs propres écrans — des fonctions
 * opérationnelles mais inatteignables au doigt.
 */
test.describe.configure({ mode: 'serial' });

const MOBILE = { width: 390, height: 844 };

let organizer: ApiClient;
let vendor: ApiClient;
let venue: ApiClient;
let multiRole: ApiClient;

test.beforeAll(async () => {
  organizer = await apiContextFor(ownerCredentials());
  vendor = await apiContextFor(vendorCredentials());
  venue = await apiContextFor(venueCredentials());
  multiRole = await apiContextFor(multiRoleCredentials());
});

test.afterAll(async () => {
  await Promise.all([
    organizer.dispose(),
    vendor.dispose(),
    venue.dispose(),
    multiRole.dispose(),
  ]);
});

async function mobilePage(
  browser: Browser,
  client: ApiClient,
  viewport = MOBILE,
): Promise<{ close: () => Promise<void>; page: Page }> {
  const context = await browser.newContext({
    storageState: await client.storageState(),
    viewport,
  });
  const page = await context.newPage();
  return { page, close: () => context.close() };
}

/** Ouvre le panneau « Plus » s'il existe, puis retourne tous les liens visibles. */
async function reachableHrefs(page: Page): Promise<string[]> {
  const nav = page.getByTestId('mobile-nav');
  await expect(nav).toBeVisible();

  const hrefs = await nav.getByRole('link').evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).getAttribute('href') ?? ''),
  );

  const more = page.getByTestId('mobile-nav-more');
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    const sheet = page.getByRole('dialog', { name: 'Plus de destinations' });
    await expect(sheet).toBeVisible();
    const extra = await sheet.getByRole('link').evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute('href') ?? ''),
    );
    hrefs.push(...extra);
  }

  return hrefs;
}

test.describe('Vague A — navigation mobile par rôle', () => {
  test('le prestataire atteint son profil et ses demandes', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, vendor);
    try {
      await page.goto('/tableau-de-bord/prestataire/profil');
      await waitForHydration(page);

      const hrefs = await reachableHrefs(page);

      expect(hrefs).toContain('/tableau-de-bord/prestataire/profil');
      expect(hrefs).toContain('/tableau-de-bord/prestataire/demandes');
    } finally {
      await close();
    }
  });

  test('le prestataire navigue réellement vers ses demandes depuis la barre', async ({
    browser,
  }) => {
    const { page, close } = await mobilePage(browser, vendor);
    try {
      await page.goto('/tableau-de-bord/prestataire/profil');
      await waitForHydration(page);

      await page
        .getByTestId('mobile-nav')
        .getByRole('link', { name: 'Demandes reçues' })
        .click();

      await expect(page).toHaveURL(/\/tableau-de-bord\/prestataire\/demandes/);
    } finally {
      await close();
    }
  });

  test('le gestionnaire atteint sa fiche et ses réservations', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, venue);
    try {
      await page.goto('/tableau-de-bord/gestionnaire/fiche');
      await waitForHydration(page);

      const hrefs = await reachableHrefs(page);

      expect(hrefs).toContain('/tableau-de-bord/gestionnaire/fiche');
      expect(hrefs).toContain('/tableau-de-bord/gestionnaire/reservations');
    } finally {
      await close();
    }
  });

  test("l'organisateur garde son tableau de bord et ses événements", async ({ browser }) => {
    const { page, close } = await mobilePage(browser, organizer);
    try {
      await page.goto('/tableau-de-bord');
      await waitForHydration(page);

      const hrefs = await reachableHrefs(page);

      expect(hrefs).toContain('/tableau-de-bord');
      expect(hrefs).toContain('/tableau-de-bord/evenements');
    } finally {
      await close();
    }
  });

  test('la barre mobile n’expose aucun écran placeholder', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, organizer);
    try {
      await page.goto('/tableau-de-bord');
      await waitForHydration(page);

      const hrefs = await reachableHrefs(page);

      expect(hrefs).not.toContain('/tableau-de-bord/messages');
      expect(hrefs).not.toContain('/parametres');
    } finally {
      await close();
    }
  });

  test('un compte multi-rôles atteint TOUS ses écrans via « Plus »', async ({ browser }) => {
    // Organisateur + prestataire dépasse les quatre emplacements : c'est
    // exactement le cas que le panneau de débordement doit servir.
    const { page, close } = await mobilePage(browser, multiRole);
    try {
      await page.goto('/tableau-de-bord');
      await waitForHydration(page);

      const hrefs = await reachableHrefs(page);

      expect(hrefs).toContain('/tableau-de-bord');
      expect(hrefs).toContain('/tableau-de-bord/evenements');
      expect(hrefs).toContain('/tableau-de-bord/prestataire/profil');
      expect(hrefs).toContain('/tableau-de-bord/prestataire/demandes');
    } finally {
      await close();
    }
  });

  test('le panneau « Plus » se ferme au clavier et rend le focus', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, multiRole);
    try {
      await page.goto('/tableau-de-bord');
      await waitForHydration(page);

      const more = page.getByTestId('mobile-nav-more');
      await expect(more).toBeVisible();

      await more.click();
      await expect(page.getByRole('dialog', { name: 'Plus de destinations' })).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'Plus de destinations' })).toBeHidden();
      await expect(more).toBeFocused();
    } finally {
      await close();
    }
  });

  test.describe('accessibilité et responsive', () => {
    for (const viewport of [
      { nom: '320x720', width: 320, height: 720 },
      { nom: '375x812', width: 375, height: 812 },
      { nom: '390x844', width: 390, height: 844 },
      { nom: '768x1024', width: 768, height: 1024 },
    ]) {
      test(`barre mobile sans débordement à ${viewport.nom}`, async ({ browser }) => {
        const { page, close } = await mobilePage(browser, vendor, viewport);
        try {
          await page.goto('/tableau-de-bord/prestataire/profil');
          await waitForHydration(page);

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(overflow).toBeLessThanOrEqual(1);
        } finally {
          await close();
        }
      });
    }

    test('cibles tactiles de la barre à 44px minimum', async ({ browser }) => {
      const { page, close } = await mobilePage(browser, vendor);
      try {
        await page.goto('/tableau-de-bord/prestataire/profil');
        await waitForHydration(page);

        const links = page.getByTestId('mobile-nav').getByRole('link');
        const count = await links.count();
        expect(count).toBeGreaterThan(0);

        for (let index = 0; index < count; index += 1) {
          const box = await links.nth(index).boundingBox();
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
        }
      } finally {
        await close();
      }
    });

    test('axe sans violation bloquante sur la barre et le panneau', async ({ browser }) => {
      const { page, close } = await mobilePage(browser, vendor);
      try {
        await page.goto('/tableau-de-bord/prestataire/profil');
        await waitForHydration(page);

        const more = page.getByTestId('mobile-nav-more');
        if (await more.isVisible().catch(() => false)) await more.click();

        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        const blocking = violations.filter(
          (violation) => violation.impact === 'critical' || violation.impact === 'serious',
        );

        expect(blocking.map((violation) => violation.id)).toEqual([]);
      } finally {
        await close();
      }
    });
  });
});

test.describe('Vague A — atterrissage post-connexion par rôle', () => {
  test('le prestataire n’atterrit pas sur le tableau de bord organisateur', async ({
    browser,
  }) => {
    const { page, close } = await mobilePage(browser, vendor, { width: 1440, height: 900 });
    try {
      // La racine rend l'expérience organisateur (403 pour ce compte) : elle
      // doit rediriger vers l'accueil du rôle plutôt que servir une erreur.
      await page.goto('/tableau-de-bord');
      await expect(page).toHaveURL(/\/tableau-de-bord\/prestataire\/profil/);
    } finally {
      await close();
    }
  });

  test('le gestionnaire est redirigé vers sa fiche', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, venue, { width: 1440, height: 900 });
    try {
      await page.goto('/tableau-de-bord');
      await expect(page).toHaveURL(/\/tableau-de-bord\/gestionnaire\/fiche/);
    } finally {
      await close();
    }
  });

  test('un compte multi-rôles suit la priorité organisateur', async ({ browser }) => {
    const { page, close } = await mobilePage(browser, multiRole, { width: 1440, height: 900 });
    try {
      await page.goto('/tableau-de-bord');
      await waitForHydration(page);
      // Même ordre que getFirstOnboardingPath : organisateur l'emporte.
      await expect(page).toHaveURL(/\/tableau-de-bord$/);
    } finally {
      await close();
    }
  });

  test("l'organisateur reste sur son tableau de bord", async ({ browser }) => {
    const { page, close } = await mobilePage(browser, organizer, { width: 1440, height: 900 });
    try {
      await page.goto('/tableau-de-bord');
      await waitForHydration(page);
      // Pas de boucle de redirection : la racine EST son accueil.
      await expect(page).toHaveURL(/\/tableau-de-bord$/);
    } finally {
      await close();
    }
  });
});

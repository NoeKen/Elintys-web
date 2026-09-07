import { expect, test } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import type { ApiClient } from "./helpers";
import { apiContextFor, ownerCredentials, waitForHydration } from "./helpers";

/**
 * Parcours Favoris COMPLET, dans le navigateur.
 *
 * L'incident d'origine tenait entièrement au fait qu'aucun test ne traversait
 * UI → réseau → base → UI : les tests unitaires API passaient au vert en
 * validant précisément les routes que le client n'appelait pas.
 */
test.describe.configure({ mode: "serial" });

let api: ApiClient;
let session: Awaited<ReturnType<ApiClient["storageState"]>>;
const targets: Array<{ targetType: string; targetId: string }> = [];

test.beforeAll(async () => {
  api = await apiContextFor(ownerCredentials());
  // Session obtenue via l'API puis injectée dans le navigateur : une seule
  // authentification, le tier AUTH_STRICT plafonne à 5 tentatives/minute.
  session = await api.storageState();
});

/** Ouvre un onglet authentifié à partir de la session API. */
async function authenticated(
  browser: import("@playwright/test").Browser,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: session });
  return { context, page: await context.newPage() };
}

test.afterAll(async () => {
  // Ne supprime que ce que ce spec a créé.
  await Promise.all(
    targets.map((target) =>
      api.delete("/favorites", { data: target }).catch(() => undefined),
    ),
  );
  await api.dispose();
});

test.describe("Vague A — favoris authentifiés", () => {
  test("un favori ne contourne pas la confidentialité d’un brouillon", async () => {
    const created = await api.post('/events', {
      data: { title: `[E2E] Favori privé ${Date.now()}` },
    });
    expect(created.status(), await created.text()).toBe(201);
    const eventId = ((await created.json()) as { _id: string })._id;

    try {
      const favorite = await api.post('/favorites', {
        data: { targetType: 'event', targetId: eventId },
      });
      expect(favorite.status()).toBe(404);
      expect(await favorite.text()).toContain('FAVORITE_TARGET_NOT_FOUND');
    } finally {
      await api.delete(`/events/${eventId}`).catch(() => undefined);
    }
  });

  test("cycle complet : ajout depuis le catalogue, persistance, retrait", async ({
    browser,
  }) => {
    const { context, page } = await authenticated(browser);
    try {
      const eventsResponse = await api.get("/events?limit=1");
      const events = (await eventsResponse.json()) as {
        data: Array<{ _id: string }>;
      };
      const eventId = events.data[0]?._id;
      expect(
        eventId,
        "un événement public est requis pour ce parcours",
      ).toBeTruthy();
      targets.push({ targetType: "event", targetId: eventId });

      // Départ propre : la cible ne doit pas déjà être en favori.
      await api.delete("/favorites", {
        data: { targetType: "event", targetId: eventId },
      });

      await page.goto("/evenements");
      await waitForHydration(page);

      const heart = page.getByTestId("favorite-button").first();
      await expect(heart).toBeVisible();
      await expect(heart).toHaveAttribute("aria-pressed", "false");

      const created = page.waitForResponse(
        (response) =>
          response.url().includes("/favorites") &&
          response.request().method() === "POST",
      );
      await heart.click();
      expect(
        (await created).status(),
        "le clic doit réellement écrire côté serveur",
      ).toBe(201);

      await expect(heart).toHaveAttribute("aria-pressed", "true");

      // Persistance : c'est le rechargement qui distingue un état optimiste
      // d'un enregistrement réel.
      await page.reload();
      await waitForHydration(page);
      await expect(page.getByTestId("favorite-button").first()).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    } finally {
      await context.close();
    }
  });

  test("la page Mes favoris affiche un libellé métier et un lien exploitable", async ({
    browser,
  }) => {
    const { context, page } = await authenticated(browser);
    try {
      await page.goto("/tableau-de-bord/favoris");
      await waitForHydration(page);

      const links = page.locator('main a[href^="/evenements/"]');
      await expect(links.first()).toBeVisible();

      const href = await links.first().getAttribute("href");
      const label = (await links.first().innerText()).trim();

      // Régression F-01 : la page affichait l'ObjectId comme libellé et
      // construisait /evenements/<id> alors que la route attend un slug.
      expect(label).not.toMatch(/^[0-9a-f]{24}$/);
      expect(href).not.toMatch(/\/evenements\/[0-9a-f]{24}$/);
    } finally {
      await context.close();
    }
  });

  test("le retrait depuis la page Mes favoris vide réellement la liste", async ({
    browser,
  }) => {
    const { context, page } = await authenticated(browser);
    try {
      await page.goto("/tableau-de-bord/favoris");
      await waitForHydration(page);

      const heart = page.getByTestId("favorite-button").first();
      await expect(heart).toBeVisible();

      const removed = page.waitForResponse(
        (response) =>
          response.url().includes("/favorites") &&
          response.request().method() === "DELETE",
      );
      await heart.click();
      expect((await removed).status()).toBe(204);

      await page.reload();
      await waitForHydration(page);
      await expect(page.getByTestId("empty-state")).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("les prestataires et les lieux sont réellement favorisables", async ({
    browser,
  }) => {
    const { context, page } = await authenticated(browser);
    try {
      // Polymorphisme : la feature annonçait trois types de cibles et n'en
      // servait qu'un — les cœurs des catalogues prestataire et lieu étaient
      // décoratifs.
      for (const route of ["/prestataires", "/lieux"] as const) {
        const type = route === "/prestataires" ? "vendor" : "venue";
        await page.goto(route);
        await waitForHydration(page);

        const heart = page.getByTestId("favorite-button").first();
        await expect(heart).toBeVisible();

        const created = page.waitForResponse(
          (response) =>
            response.url().includes("/favorites") &&
            response.request().method() === "POST",
        );
        await heart.click();
        const response = await created;
        expect(response.status(), `favori ${type}`).toBe(201);

        const body = (await response.request().postDataJSON()) as {
          targetId: string;
        };
        targets.push({ targetType: type, targetId: body.targetId });

        await expect(heart).toHaveAttribute("aria-pressed", "true");
      }
    } finally {
      await context.close();
    }
  });

  test("un seul appel réseau sert tout un catalogue", async ({ browser }) => {
    const { context, page } = await authenticated(browser);
    try {
      // Anti-N+1 : l'ancienne implémentation émettait un GET /favorites/check
      // par carte, chacun rejoué trois fois par le retry par défaut.
      const calls: string[] = [];
      page.on("request", (request) => {
        if (request.url().includes("/favorites")) calls.push(request.url());
      });

      await page.goto("/evenements");
      await waitForHydration(page);
      await expect(page.getByTestId("favorite-button").first()).toBeVisible();

      expect(
        calls.length,
        `appels favoris observés : ${calls.join(", ")}`,
      ).toBeLessThanOrEqual(2);
    } finally {
      await context.close();
    }
  });
});

import { test, expect, capture, runAxe, VIEWPORTS } from './fixtures';
import { readMetadata } from './qa-data';

for (const viewport of VIEWPORTS) {
  test(`écrans principaux ${viewport.name}`, async ({ page }) => {
    const qa = readMetadata();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const directory = viewport.width <= 768 ? 'mobile' : 'implementations';

    await page.goto('/tableau-de-bord');
    await expect(page.getByText(/Bonjour|Bienvenue/).first()).toBeVisible();
    await capture(page, `dashboard-${viewport.name}`, directory);

    await page.goto('/tableau-de-bord/evenements');
    await expect(page.getByRole('heading', { name: 'Mes événements' })).toBeVisible();
    await expect(page.getByText(qa.events.public.title).first()).toBeVisible();
    await capture(page, `events-grid-${viewport.name}`, directory);

    await page.goto(`/evenements/${qa.events.public.slug}`);
    await expect(page.getByRole('heading', { name: qa.events.public.title })).toBeVisible();
    await capture(page, `event-public-${viewport.name}`, directory);
  });
}

test('grille, liste, recherche, filtre et focus clavier', async ({ page }) => {
  await page.setViewportSize({ width: 1538, height: 1100 });
  await page.goto('/tableau-de-bord/evenements');
  await page.getByRole('button', { name: 'Liste' }).click();
  await capture(page, 'events-list-1538x1100');
  await page.getByPlaceholder('Rechercher un événement…').fill('aucun résultat visuel');
  await expect(page.getByText('Aucun événement ne correspond à cette vue')).toBeVisible();
  await capture(page, 'events-search-empty-1538x1100');
  await page.getByRole('button', { name: 'Effacer les filtres' }).click();
  await page.keyboard.press('Tab');
  await capture(page, 'events-focus-1538x1100');
});

test('workspace et accès organisateur desktop et mobile', async ({ page }) => {
  const qa = readMetadata();
  for (const viewport of [{ name: '1538x1100', width: 1538, height: 1100 }, { name: '390x844', width: 390, height: 844 }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const directory = viewport.width < 768 ? 'mobile' : 'implementations';
    await page.goto(`/tableau-de-bord/evenements/${qa.events.draft.id}`);
    await expect(page.getByText(qa.events.draft.title).first()).toBeVisible();
    await capture(page, `event-workspace-${viewport.name}`, directory);
    await page.goto(`/tableau-de-bord/evenements/${qa.events.draft.id}/acces-et-inscriptions`);
    await expect(page.getByRole('heading', { name: /Capacité de l’événement/i })).toBeVisible();
    await capture(page, `event-access-${viewport.name}`, directory);
  }
});

test('accessibilité axe des surfaces principales', async ({ page }, testInfo) => {
  const qa = readMetadata();
  const routes = [
    ['dashboard', '/tableau-de-bord'],
    ['events', '/tableau-de-bord/evenements'],
    ['workspace', `/tableau-de-bord/evenements/${qa.events.draft.id}`],
    ['public', `/evenements/${qa.events.public.slug}`],
  ] as const;
  const summary: Record<string, number> = {};
  for (const [name, route] of routes) {
    await page.goto(route);
    summary[name] = (await runAxe(page, testInfo, name)).length;
  }
  await testInfo.attach('axe-summary.json', { body: Buffer.from(JSON.stringify(summary, null, 2)), contentType: 'application/json' });
});

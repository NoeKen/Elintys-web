import { chromium } from '@playwright/test';

const base = process.env.QA_BASE_URL ?? 'http://localhost:3100';
const output = new URL('../docs/design-qa/event-experience/', import.meta.url).pathname;
const email = process.env.QA_EMAIL;
const password = process.env.QA_PASSWORD;
const apiBase = process.env.QA_API_URL ?? 'https://api.dev.elintys.com/api/v1';

if (!email || !password) {
  throw new Error('QA_EMAIL et QA_PASSWORD sont requis pour exécuter le parcours authentifié.');
}
const browser = await chromium.launch({
  headless: true,
  args: process.env.QA_DISABLE_WEB_SECURITY === '1' ? ['--disable-web-security'] : [],
});
const context = await browser.newContext({ viewport: { width: 1538, height: 1000 } });
const page = await context.newPage();
const consoleErrors = [];
const failedRequests = [];
const apiResponses = [];

if (process.env.QA_TRUST_DEV_ORIGIN === '1') {
  await page.route(`${apiBase}/**`, async (route) => {
    const request = route.request();
    const response = await context.request.fetch(request.url(), {
      method: request.method(),
      data: request.postDataBuffer() ?? undefined,
      headers: {
        ...request.headers(),
        origin: 'https://dev.elintys.com',
        referer: 'https://dev.elintys.com/',
        'sec-fetch-site': 'same-origin',
      },
    });
    const responseBody = await response.body();
    if (response.status() >= 400) {
      console.log(`QA: API ${request.method()} ${request.url()} -> ${response.status()} ${responseBody.toString('utf8').slice(0, 200)}`);
    }
    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: responseBody,
    });
  });
}

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('requestfailed', (request) => failedRequests.push({
  url: request.url(), error: request.failure()?.errorText,
}));
page.on('response', (response) => {
  if (response.url().includes('/api/v1/')) {
    apiResponses.push({
      status: response.status(),
      method: response.request().method(),
      url: response.url().replace(/\?.*$/, ''),
    });
  }
});

console.log('QA: ouverture de la connexion');
if (process.env.QA_DIRECT_AUTH === '1') {
  const response = await context.request.post(`${apiBase}/auth/login`, { data: { email, password } });
  console.log(`QA: authentification API ${response.status()}`);
  const sessionCookies = await context.cookies();
  if (process.env.QA_DISABLE_WEB_SECURITY === '1') {
    await context.clearCookies();
    await context.addCookies(sessionCookies.map((cookie) => ({ ...cookie, sameSite: 'None' })));
  }
  console.log('QA: cookies', (await context.cookies()).map(({ name, domain, sameSite, secure }) => ({ name, domain, sameSite, secure })));
} else {
  await page.goto(`${base}/connexion`, { waitUntil: 'domcontentloaded' });
  console.log(`QA: page de connexion ${page.url()} — ${(await page.locator('body').innerText()).slice(0, 120)}`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForTimeout(1500);
  console.log(`QA: session après connexion ${page.url()}`);
}

await page.goto(`${base}/tableau-de-bord`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${output}dashboard-1538.png`, fullPage: true });
const dashboardText = await page.locator('body').innerText();

await page.goto(`${base}/tableau-de-bord/evenements`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${output}events-grid-1538.png`, fullPage: true });
const eventsText = await page.locator('body').innerText();
const listButton = page.getByRole('button', { name: /^Liste$/ });
if (await listButton.isVisible()) await listButton.click();
await page.screenshot({ path: `${output}events-list-1538.png`, fullPage: true });

const eventLink = page.locator('main a[href^="/tableau-de-bord/evenements/"]').first();
const href = await eventLink.count() > 0 ? await eventLink.getAttribute('href') : null;
if (href) {
  const eventBase = href.split('/configuration')[0];
  await page.goto(`${base}${eventBase}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${output}event-workspace-1538.png`, fullPage: true });
  await page.goto(`${base}${eventBase}/acces-et-inscriptions`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${output}event-access-1538.png`, fullPage: true });
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/tableau-de-bord/evenements`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${output}events-grid-390.png`, fullPage: true });

console.log(JSON.stringify({
  finalUrl: page.url(),
  dashboardHasGreeting: /Bonjour|Bienvenue/.test(dashboardText),
  eventsHasTitle: eventsText.includes('Mes événements'),
  eventsHasSeed: eventsText.includes('Brouillon') || eventsText.includes('Publié'),
  apiResponses,
  failedRequests,
  consoleErrors,
}, null, 2));

await page.unrouteAll({ behavior: 'ignoreErrors' });
await browser.close();

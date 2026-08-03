import fs from 'node:fs';
import path from 'node:path';
import { expect, test as base, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { API_URL } from './qa-data';

export const VIEWPORTS = [
  { name: '1538x1100', width: 1538, height: 1100 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
  { name: '375x812', width: 375, height: 812 },
  { name: '320x720', width: 320, height: 720 },
] as const;

export async function installApiBridge(context: BrowserContext) {
  await context.route(`${API_URL}/**`, async (route) => {
    try {
      const request = route.request();
      const headers = { ...request.headers(), origin: 'https://dev.elintys.com', referer: 'https://dev.elintys.com/', 'sec-fetch-site': 'same-origin' };
      const response = await context.request.fetch(request.url(), {
        method: request.method(),
        data: request.postDataBuffer() ?? undefined,
        headers,
      });
      const responseHeaders = response.headers();
      delete responseHeaders['content-encoding'];
      delete responseHeaders['content-length'];
      responseHeaders['access-control-allow-origin'] = 'http://localhost:3100';
      responseHeaders['access-control-allow-credentials'] = 'true';
      await route.fulfill({ status: response.status(), headers: responseHeaders, body: await response.body() });
    } catch {
      await route.abort('failed').catch(() => undefined);
    }
  });
}

type Diagnostics = { consoleErrors: string[]; pageErrors: string[]; httpErrors: Array<{ status: number; url: string }>; failedRequests: string[] };

export const test = base.extend<{ diagnostics: Diagnostics }>({
  context: async ({ context }, next) => {
    await context.route('**/_vercel/insights/script.js', (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await installApiBridge(context);
    await next(context);
    await context.unrouteAll({ behavior: 'ignoreErrors' });
  },
  diagnostics: [async ({ page }, use, testInfo) => {
    const diagnostics: Diagnostics = { consoleErrors: [], pageErrors: [], httpErrors: [], failedRequests: [] };
    page.on('console', (message) => { if (message.type() === 'error') diagnostics.consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
      if (/\.(?:hot-update\.json)|webpack-hmr/.test(request.url())) return;
      if (request.url().includes('_rsc=') && request.failure()?.errorText === 'net::ERR_ABORTED') return;
      if (request.url().includes('/auth/refresh') && request.failure()?.errorText === 'net::ERR_ABORTED') return;
      diagnostics.failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
    });
    page.on('response', (response) => { if (response.status() >= 400 && response.url().includes('/api/v1/')) diagnostics.httpErrors.push({ status: response.status(), url: response.url().replace(/\?.*$/, '') }); });
    await use(diagnostics);
    await testInfo.attach('diagnostics.json', { body: Buffer.from(JSON.stringify(diagnostics, null, 2)), contentType: 'application/json' });
    const allowsHttpErrors = testInfo.annotations.some((annotation) => annotation.type === 'expected-http-error');
    const unexpectedConsoleErrors = allowsHttpErrors
      ? diagnostics.consoleErrors.filter((message) => !message.includes('Failed to load resource'))
      : diagnostics.consoleErrors;
    expect(unexpectedConsoleErrors, 'console.error inattendu').toEqual([]);
    expect(diagnostics.pageErrors, 'pageerror inattendue').toEqual([]);
    expect(diagnostics.failedRequests, 'requête réseau bloquée').toEqual([]);
    if (!allowsHttpErrors) expect(diagnostics.httpErrors, 'réponse API 4xx/5xx inattendue').toEqual([]);
  }, { auto: true }],
});

export { expect };

export async function stabilize(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}` });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.locator('.premium-skeleton').first().waitFor({ state: 'detached', timeout: 15_000 }).catch(() => undefined);
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

export async function waitForHydration(page: Page, selector = 'form') {
  await page.waitForFunction((target) => {
    const element = document.querySelector(target);
    return Boolean(element && Object.keys(element).some((key) => key.startsWith('__reactFiber$') || key.startsWith('__reactProps$')));
  }, selector);
}

export async function capture(page: Page, name: string, directory: 'implementations' | 'mobile' = 'implementations') {
  await stabilize(page);
  const overflow = await page.evaluate(() => ({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(overflow.scrollWidth - overflow.innerWidth, `${name}: débordement horizontal`).toBeLessThanOrEqual(1);
  const broken = await page.locator('img').evaluateAll((images) => images
    .map((image) => image as HTMLImageElement)
    .filter((image) => image.complete && image.naturalWidth === 0)
    .map((image) => image.currentSrc));
  expect(broken, `${name}: image cassée`).toEqual([]);
  const target = path.resolve(`docs/design-qa/event-experience/${directory}/${name}.png`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  await page.screenshot({ path: target, fullPage: true, animations: 'disabled' });
  return target;
}

export async function runAxe(page: Page, testInfo: TestInfo, name: string) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await testInfo.attach(`axe-${name}.json`, { body: Buffer.from(JSON.stringify(result.violations, null, 2)), contentType: 'application/json' });
  return result.violations;
}

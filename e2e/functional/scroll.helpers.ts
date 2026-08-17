import { expect, type Locator, type Page } from '@playwright/test';

type ScrollMetrics = {
  scrollHeight: number;
  clientHeight: number;
  scrollY: number;
};

async function documentMetrics(page: Page): Promise<ScrollMetrics> {
  return page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: window.innerHeight,
    scrollY: window.scrollY,
  }));
}

async function focusDocument(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
  });
}

async function resetDocumentScroll(page: Page): Promise<void> {
  await page.evaluate(() => {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    document.documentElement.style.scrollBehavior = previous;
  });
  await expect.poll(async () => (await documentMetrics(page)).scrollY, {
    message: 'le document doit être revenu en haut avant le scénario suivant',
  }).toBeLessThanOrEqual(1);
}

async function waitForDocumentScrollToSettle(page: Page): Promise<void> {
  let previous = (await documentMetrics(page)).scrollY;
  let stableSamples = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await page.waitForTimeout(100);
    const current = (await documentMetrics(page)).scrollY;
    stableSamples = Math.abs(current - previous) <= 1 ? stableSamples + 1 : 0;
    if (stableSamples >= 3) return;
    previous = current;
  }
  throw new Error('le scroll ne se stabilise pas');
}

/**
 * Vérifie le vrai scroll du document avec les entrées utilisées par un visiteur.
 * La fonction refuse les faux positifs produits par un wrapper `overflow:auto` ou
 * par un overlay transparent qui recouvre tout le viewport.
 */
export async function assertPageIsScrollable(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  const initial = await documentMetrics(page);
  expect(initial.scrollHeight, 'le document ne doit pas être artificiellement plus court que le viewport').toBeGreaterThanOrEqual(initial.clientHeight);

  const documentOverflow = await page.evaluate(() => ({
    body: getComputedStyle(document.body).overflowY,
    html: getComputedStyle(document.documentElement).overflowY,
  }));
  expect([documentOverflow.body, documentOverflow.html], 'le document ne doit pas être verrouillé en overflow hidden')
    .not.toContain('hidden');

  const blockingOverlays = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('body *'))
    .filter((element) => {
      const style = getComputedStyle(element);
      if (style.pointerEvents === 'none' || style.visibility === 'hidden' || style.display === 'none') return false;
      if (style.position !== 'fixed') return false;
      const rect = element.getBoundingClientRect();
      const coversViewport = rect.width >= innerWidth * 0.92 && rect.height >= innerHeight * 0.92;
      const invisible = Number(style.opacity) === 0 || style.backgroundColor === 'rgba(0, 0, 0, 0)';
      return coversViewport && invisible && !element.matches('[role="dialog"], [data-radix-dialog-overlay]');
    })
    .map((element) => element.className || element.tagName));
  expect(blockingOverlays, 'aucun overlay invisible ne doit intercepter le scroll').toEqual([]);

  // Une page qui tient entièrement dans le viewport n'a légitimement aucun
  // déplacement à produire. Les checks de verrouillage ci-dessus restent requis.
  if (initial.scrollHeight <= initial.clientHeight + 8) return;

  await resetDocumentScroll(page);
  await page.mouse.move(Math.floor((page.viewportSize()?.width ?? 800) / 2), Math.floor((page.viewportSize()?.height ?? 600) / 2));
  await page.mouse.wheel(0, Math.max(500, initial.clientHeight * 0.7));
  await expect.poll(async () => (await documentMetrics(page)).scrollY, { message: 'la molette doit déplacer window.scrollY' }).toBeGreaterThan(0);
  await waitForDocumentScrollToSettle(page);

  await resetDocumentScroll(page);
  await focusDocument(page);
  await page.keyboard.press('PageDown');
  await expect.poll(async () => (await documentMetrics(page)).scrollY, { message: 'PageDown doit déplacer le document' }).toBeGreaterThan(0);
  await waitForDocumentScrollToSettle(page);

  await page.keyboard.press('End');
  await expect.poll(async () => {
    const metrics = await documentMetrics(page);
    return metrics.scrollY + metrics.clientHeight;
  }, { message: 'End doit atteindre le bas du document' }).toBeGreaterThanOrEqual(initial.scrollHeight - 2);
  await focusDocument(page);
  await page.keyboard.press('Home');
  await expect.poll(async () => (await documentMetrics(page)).scrollY, { message: 'Home doit revenir en haut' }).toBeLessThanOrEqual(1);

  await focusDocument(page);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await documentMetrics(page)).scrollY, { message: 'Espace doit faire défiler le document' }).toBeGreaterThan(0);
  await waitForDocumentScrollToSettle(page);
  const afterSpace = await documentMetrics(page);
  await page.keyboard.press('Shift+Space');
  await expect.poll(async () => (await documentMetrics(page)).scrollY, { message: 'Maj+Espace doit remonter le document' }).toBeLessThan(afterSpace.scrollY);
}

export async function assertInternalScrollerIsScrollable(scroller: Locator): Promise<void> {
  const metrics = await scroller.evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    scrollTop: element.scrollTop,
  }));
  expect(metrics.scrollHeight, 'le conteneur interne doit dépasser sa hauteur visible').toBeGreaterThan(metrics.clientHeight + 8);
  await scroller.hover();
  await scroller.page().mouse.wheel(0, Math.max(500, metrics.clientHeight * 0.7));
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop), {
    message: 'la molette doit déplacer le conteneur interne explicite',
  }).toBeGreaterThan(0);
}

export async function assertTouchScroll(page: Page): Promise<void> {
  await resetDocumentScroll(page);
  const session = await page.context().newCDPSession(page);
  const x = Math.floor((page.viewportSize()?.width ?? 390) / 2);
  const startY = Math.floor((page.viewportSize()?.height ?? 720) * 0.78);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: startY }],
  });
  for (const y of [startY - 80, startY - 160, startY - 240, startY - 320]) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y }],
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY), {
    message: 'un geste tactile vertical doit déplacer le document',
  }).toBeGreaterThan(0);
  await session.detach();
}

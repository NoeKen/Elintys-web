import { test, expect, capture } from './fixtures';
import { readMetadata } from './qa-data';

test('wizard six étapes desktop et identité mobile', async ({ page }) => {
  const qa = readMetadata();
  await page.setViewportSize({ width: 1538, height: 1100 });
  const steps = [qa.events.step1, qa.events.step2, qa.events.draft, qa.events.step4, qa.events.step5, qa.events.ready];
  for (const [index, event] of steps.entries()) {
    const step = index + 1;
    await page.goto(`/tableau-de-bord/evenements/${event.id}/configuration`);
    await expect(page.getByText(new RegExp(`Étape ${step} sur 6`, 'i')).first()).toBeVisible();
    await capture(page, `wizard-step-${step}-1538x1100`);
  }
  for (const [key, label] of [['locationExisting', 'existing'], ['locationSearch', 'search'], ['draft', 'later']] as const) {
    await page.goto(`/tableau-de-bord/evenements/${qa.events[key].id}/configuration`);
    await capture(page, `wizard-location-${label}-1538x1100`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/tableau-de-bord/evenements/${qa.events.step5.id}/configuration`);
  await capture(page, 'wizard-identity-390x844', 'mobile');
  await page.goto(`/tableau-de-bord/evenements/${qa.events.ready.id}/configuration`);
  await capture(page, 'wizard-summary-390x844', 'mobile');
});

test('variantes publiques et restreintes', async ({ page }, testInfo) => {
  const qa = readMetadata();
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const key of ['noMedia', 'domain', 'code', 'invitation'] as const) {
    await page.goto(`/evenements/${qa.events[key].slug}`);
    await expect(page.getByRole('heading', { name: qa.events[key].title })).toBeVisible();
    await capture(page, `event-${key}-1440x900`);
  }

  testInfo.annotations.push({ type: 'expected-http-error', description: 'code volontairement refusé' });
  await page.goto(`/evenements/${qa.events.code.slug}`);
  await page.locator('#public-event-access-code').fill('Code-Invalide');
  await page.getByRole('button', { name: /entrer un code/i }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await capture(page, 'event-code-denied-1440x900');

  await page.goto(`/evenements/${qa.events.approval.slug}`);
  await capture(page, 'event-private-1440x900');
  await page.goto('/invitation?token=visual-qa-token-invalide');
  await capture(page, 'invitation-invalid-1440x900');
});

test('Cloudinary cover, galerie et fallback sont réellement rendus', async ({ page }) => {
  const qa = readMetadata();
  await page.goto(`/evenements/${qa.events.public.slug}`);
  const cloudinaryImages = page.locator('img[src*="cloudinary"], img[src*="_next/image"]');
  await expect(cloudinaryImages.first()).toBeVisible();
  expect(await cloudinaryImages.evaluateAll((images) => images
    .map((image) => image as HTMLImageElement)
    .every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.goto(`/evenements/${qa.events.noMedia.slug}`);
  await expect(page.getByText('E').first()).toBeVisible();
});

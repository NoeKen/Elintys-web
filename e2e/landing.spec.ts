import { expect, test } from "@playwright/test";

test("la landing page se charge sans erreur console", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const response = await page.goto("/");

  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
  expect(consoleErrors).toEqual([]);
});

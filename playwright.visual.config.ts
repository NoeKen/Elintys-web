import { defineConfig } from '@playwright/test';

const port = 3100;

export default defineConfig({
  testDir: './e2e/visual',
  outputDir: 'test-results/visual',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/visual', open: 'never' }]],
  globalSetup: './e2e/visual/global-setup.ts',
  globalTeardown: './e2e/visual/global-teardown.ts',
  use: {
    baseURL: process.env.VISUAL_BASE_URL ?? `http://localhost:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-CA',
    timezoneId: 'America/Toronto',
    colorScheme: 'light',
  },
  projects: [
    { name: 'visual-auth', testMatch: /auth\.setup\.ts/ },
    {
      name: 'visual-chromium',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['visual-auth'],
      use: { storageState: '.visual-qa/auth.json', launchOptions: { args: ['--disable-web-security'] } },
    },
  ],
  webServer: {
    command: 'bash scripts/start-visual-server.sh',
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Charge `.env` dans `process.env` (Playwright ne le fait pas, contrairement à Next).
 * Les valeurs déjà présentes dans l'environnement ont priorité.
 */
function loadEnvFile(file: string): void {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) return;
  for (const line of fs.readFileSync(fullPath, 'utf8').split('\n')) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    const value = rawValue.trim().replace(/^["']|["']$/g, '');
    if (!value) continue;
    process.env[key] = value;
  }
}

loadEnvFile('.env');

/**
 * Batterie E2E **fonctionnelle** (Sprint 1, partie B).
 *
 * Contrairement à `playwright.visual.config.ts` (qui cible l'environnement dev
 * déployé), cette configuration démarre la pile complète en local :
 * API NestJS sur :3001 + frontend Next sur :3000, tous deux branchés sur
 * la base `elintys-dev`.
 *
 * Prérequis : `E2E_TEST_EMAIL`, `E2E_TEST_EMAIL_SECONDARY`, `E2E_TEST_PASSWORD`
 * (comptes QA provisionnés par `npm run qa:provision` côté API).
 */
export default defineConfig({
  testDir: './e2e/functional',
  outputDir: 'test-results/functional',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/functional', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-CA',
    timezoneId: 'America/Toronto',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'owner',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.e2e/owner.json' },
    },
  ],
  webServer: [
    {
      command: 'npm run start:dev',
      cwd: '../Elintys-api',
      url: 'http://localhost:3001/api/v1/health',
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});

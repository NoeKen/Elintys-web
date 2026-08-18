import fs from 'node:fs';
import path from 'node:path';

export const QA_PREFIX = '[QA Visual]';
export const QA_DIR = path.resolve('.visual-qa');
export const QA_STATE = path.join(QA_DIR, 'auth.json');
export const QA_METADATA = path.join(QA_DIR, 'metadata.json');
export const API_URL = process.env.VISUAL_API_URL ?? 'https://api.dev.elintys.com/api/v1';
export const QA_ORIGIN = process.env.VISUAL_ORIGIN ?? (
  API_URL.startsWith('http://localhost') ? 'http://localhost:3100' : 'https://dev.elintys.com'
);

export interface QaEventRef { id: string; slug?: string; title: string; }
export interface QaMetadata { createdAt: string; events: Record<string, QaEventRef>; }

export function credentials() {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) throw new Error('E2E_TEST_EMAIL et E2E_TEST_PASSWORD sont requis.');
  return { email, password };
}

export function readMetadata(): QaMetadata {
  return JSON.parse(fs.readFileSync(QA_METADATA, 'utf8')) as QaMetadata;
}
